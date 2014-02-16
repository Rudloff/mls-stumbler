/*jslint browser: true */
/*global self*/
var updateStats = function (stats) {
    'use strict';
    document.getElementById('reportsSent').textContent = stats.reportsSent;
    document.getElementById('nbWifi').textContent = stats.nbWifi;
};
self.port.on('update', updateStats);
