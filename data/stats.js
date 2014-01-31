/*jslint browser: true */
/*global self*/
var updateStats = function (stats) {
    'use strict';
    document.getElementById('reportsSent').innerHTML = stats.reportsSent;
    document.getElementById('nbWifi').innerHTML = stats.nbWifi;
};
self.port.on('update', updateStats);
