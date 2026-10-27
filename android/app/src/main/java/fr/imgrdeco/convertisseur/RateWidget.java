package fr.imgrdeco.convertisseur;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class RateWidget extends AppWidgetProvider {
    static final String ACTION_REFRESH = "fr.imgrdeco.convertisseur.REFRESH";
    static final String PREFS = "rate";

    // 0 = {eur:{cny}}, 1 = {rates:{CNY}}
    static final String[] URLS = {
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
        "https://latest.currency-api.pages.dev/v1/currencies/eur.json",
        "https://open.er-api.com/v6/latest/EUR",
        "https://api.frankfurter.app/latest?from=EUR&to=CNY"
    };
    static final int[] KIND = {0, 0, 1, 1};

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        refresh(c, goAsync());
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (ACTION_REFRESH.equals(i.getAction())) refresh(c, goAsync());
    }

    private static void refresh(final Context c, final BroadcastReceiver.PendingResult pr) {
        draw(c, false);
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    double r = fetchRate();
                    if (r > 3 && r < 20) {
                        SharedPreferences.Editor e = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
                        e.putFloat("rate", (float) r);
                        e.putLong("time", System.currentTimeMillis());
                        e.apply();
                        draw(c, false);
                    } else {
                        draw(c, true);
                    }
                } catch (Throwable t) {
                    draw(c, true);
                } finally {
                    if (pr != null) pr.finish();
                }
            }
        }).start();
    }

    private static double fetchRate() {
        for (int i = 0; i < URLS.length; i++) {
            try {
                HttpURLConnection h = (HttpURLConnection) new URL(URLS[i]).openConnection();
                h.setConnectTimeout(6000);
                h.setReadTimeout(6000);
                BufferedReader br = new BufferedReader(new InputStreamReader(h.getInputStream(), "UTF-8"));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();
                JSONObject o = new JSONObject(sb.toString());
                double r = KIND[i] == 0
                        ? o.getJSONObject("eur").getDouble("cny")
                        : o.getJSONObject("rates").getDouble("CNY");
                if (r > 3 && r < 20) return r;
            } catch (Throwable ignored) {
            }
        }
        return -1;
    }

    private static void draw(Context c, boolean failed) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, RateWidget.class));
        if (ids == null || ids.length == 0) return;

        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        float rate = p.getFloat("rate", 0f);
        long time = p.getLong("time", 0L);

        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_rate);
        int[] amounts = {10, 50, 100, 500};
        int[] yIds = {R.id.y1, R.id.y2, R.id.y3, R.id.y4};
        int[] eIds = {R.id.e1, R.id.e2, R.id.e3, R.id.e4};

        if (rate > 0) {
            v.setTextViewText(R.id.rate, String.format(Locale.FRANCE, "1 € = %.3f ¥", rate));
            for (int i = 0; i < 4; i++) {
                v.setTextViewText(yIds[i], "¥" + amounts[i]);
                v.setTextViewText(eIds[i], String.format(Locale.FRANCE, "%.2f €", amounts[i] / rate));
            }
            String when = new SimpleDateFormat("dd/MM HH:mm", Locale.FRANCE).format(new Date(time));
            v.setTextViewText(R.id.status, (failed ? "Hors ligne · dernier taux " : "Mis à jour ") + when);
        } else {
            v.setTextViewText(R.id.rate, "1 € = … ¥");
            for (int i = 0; i < 4; i++) {
                v.setTextViewText(yIds[i], "¥" + amounts[i]);
                v.setTextViewText(eIds[i], "—");
            }
            v.setTextViewText(R.id.status, failed ? "Pas de réseau — touche ↻ pour réessayer" : "Chargement…");
        }

        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        v.setOnClickPendingIntent(R.id.root,
                PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), flags));
        Intent ref = new Intent(c, RateWidget.class).setAction(ACTION_REFRESH);
        v.setOnClickPendingIntent(R.id.refresh, PendingIntent.getBroadcast(c, 1, ref, flags));

        m.updateAppWidget(ids, v);
    }
}
