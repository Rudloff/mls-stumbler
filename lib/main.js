/*jshint moz: true */
/*jslint devel: true */
/*global require*/
var Cc = require("chrome").Cc;
var Ci = require("chrome").Ci;

var Listener = function () {
    'use strict';
    //nsIWifiListener
};
var nbWifi = 0;
var sp = require("sdk/simple-prefs");
var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("geo.");

var addonData = require("sdk/self").data;
var stats = require("sdk/panel").Panel({
    contentURL: addonData.url('stats.html'),
    contentScriptFile: addonData.url('stats.js')
});

var updateStats = function () {
    'use strict';
    stats.port.emit('update', {reportsSent: sp.prefs.reportsSent, nbWifi: nbWifi});
};

var reqListener = function () {
    'use strict';
    console.log('HTTP response code: ' + this.status);
    if (this.status === 204) {
        sp.prefs.reportsSent += 1;
        updateStats();
    } else {
        console.error(JSON.parse(this.responseText).errors[0].description);
    }
};

var geolocation = Cc["@mozilla.org/geolocation;1"].getService(Ci.nsISupports);
var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
req.addEventListener('load', reqListener, false);

Listener.prototype = {
    onChange: function (accessPoints) {
        'use strict';
        nbWifi = accessPoints.length;
        updateStats();
        if (sp.prefs.enableStumbling) {
            var geolocProvider = prefs.getCharPref('wifi.uri'), geolocProviderURI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(geolocProvider, null, null), geolocProviderDomain = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService).getBaseDomain(geolocProviderURI);
            if (geolocProviderDomain === 'www.googleapis.com') {
                console.error('It seems you are using a proprietary geolocation provider.');
            } else {
                geolocation.getCurrentPosition(function (pos) {
                    var i, a, item, json, nomap = '_nomap';
                    item = {
                        wifi: [],
                        time: new Date().toISOString(),
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        altitude: pos.coords.altitude,
                        altitude_accuracy: pos.coords.altitudeAccuracy
                    };
                    for (i = 0; i < accessPoints.length; i += 1) {
                        a = accessPoints[i];
                        if (a.rawSSID && a.rawSSID.indexOf(nomap, a.rawSSID.length - nomap.length) <= 0) {
                            item.wifi.push({
                                key: a.mac.replace('-', ':', 'g'),
                                signal: a.signal
                            });
                        } else {
                            console.info('Ignoring ' + a.rawSSID + ' (' + a.mac + ')');
                        }
                    }
                    console.log(item);
                    json = JSON.stringify({items: [item]});
                    req.open('POST', "https://location.services.mozilla.com/v1/submit", true);
                    req.setRequestHeader("X-Nickname", sp.prefs.nickname);
                    req.setRequestHeader("Content-Type", "application/json");
                    req.send(json);
                });
            }
        }
    },

    onError: function (value) {
        'use strict';
        console.error(value);
    }
};



var listener = new Listener();
var wifi_service = Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);

wifi_service.startWatching(listener);

sp.on("showStats", function () {
    'use strict';
    stats.show();
});

sp.on("resetStats", function () {
    'use strict';
    sp.prefs.reportsSent = 0;
    updateStats();
});

require("sdk/widget").Widget({
    label: "Stumbler",
    id: "stumbler-widget",
    panel: stats,
    contentURL: addonData.url('icon-15.png')
});


