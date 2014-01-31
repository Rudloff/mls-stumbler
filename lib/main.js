/*jshint moz: true */
/*global console, require*/
const {Cc,Ci} = require("chrome");

var Listener = function () {
    //nsIWifiListener
};
var nbWifi = 0;

function reqListener () {
    console.log('HTTP response code: ' + this.status);
    if (this.status == 204) {
        sp.prefs.reportsSent += 1;
        updateStats();
    } else {
        console.error(JSON.parse(this.responseText).errors[0].description);
    }
}

var updateStats = function () {
    stats.port.emit('update', {reportsSent: sp.prefs.reportsSent, nbWifi: nbWifi});
};

Listener.prototype = {
    onChange: function (accessPoints) {
        nbWifi = accessPoints.length;
        updateStats();
        if (sp.prefs.enableStumbling) {
            var i, a, item, json;
            
            geolocation.getCurrentPosition(function (pos) {
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
                    item.wifi.push({
                        key: a.mac,
                        signal: a.signal
                    });
                }
                console.log(item);
                json = JSON.stringify({items: [item]});
                req.open('POST', "https://location.services.mozilla.com/v1/submit", true);
                req.setRequestHeader("X-Nickname", sp.prefs.nickname);
                req.setRequestHeader("Content-Type", "application/json");
                req.send(json);
            });
        }
    },

    onError: function (value) {
        console.error(value);
    }
};



var listener = new Listener();
var wifi_service = Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);
var geolocation = Cc["@mozilla.org/geolocation;1"].getService(Ci.nsISupports);
var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
req.addEventListener('load', reqListener, false);

wifi_service.startWatching(listener);

var sp = require("sdk/simple-prefs");
var addonData = require("sdk/self").data;

var stats = require("sdk/panel").Panel({
    contentURL: addonData.url('stats.html'),
    contentScriptFile: addonData.url('stats.js')
});

sp.on("showStats", function() {
    stats.show();
});

sp.on("resetStats", function() {
    sp.prefs.reportsSent = 0;
    updateStats();
});

require("sdk/widget").Widget({
    label: "Stumbler",
    id: "stumbler-widget",
    panel: stats,
    contentURL: addonData.url('icon-15.png')
});


