// IvanaFin for LG webOS: the NativeShell jellyfin-web asks the app for (device name, layout, exit,
// screen size, device profile). Same shape as tizen.js in the Samsung app.
// Remote keys need nothing here: webOS sends Back = 461 (appinfo disableBackHistoryAPI) and the media
// keys as 415/19/413/412/417, which jellyfin-web already understands.
(function () {
    'use strict';

    console.log('webOS adapter');

    function getDeviceId() {
        var id = localStorage.getItem('_deviceId2');
        if (!id) {
            id = btoa([navigator.userAgent, new Date().getTime()].join('|')).replace(/=/g, '1');
            localStorage.setItem('_deviceId2', id);
        }
        return id;
    }

    // PalmSystem.deviceInfo is a JSON string with the panel size (3840x2160 on a 4K TV)
    var deviceInfo = {};
    try { deviceInfo = JSON.parse(window.PalmSystem.deviceInfo) || {}; } catch (e) { }

    var AppInfo = {
        deviceId: getDeviceId(),
        deviceName: 'LG Smart TV (IvanaFin)',
        appName: 'IvanaFin for webOS',
        appVersion: '__IVF_VERSION__'
    };

    var SupportedFeatures = [
        'exit',
        'exitmenu',
        'externallinkdisplay',
        'htmlaudioautoplay',
        'htmlvideoautoplay',
        'physicalvolumecontrol',
        'displaylanguage',
        'otherapppromotions',
        'targetblank',
        'screensaver',
        'multiserver',
        'subtitleappearancesettings',
        'subtitleburnsettings'
    ];

    // Open another TV app by id (Games tile -> Moonlight). onFail() when it isn't installed.
    window.IvfLaunchApp = function (id, onFail) {
        try {
            var bridge = new PalmServiceBridge();
            bridge.onservicecallback = function (msg) {
                var r = {};
                try { r = JSON.parse(msg); } catch (e) { }
                if (!r.returnValue && onFail) onFail();
            };
            bridge.call('luna://com.webos.applicationManager/launch', JSON.stringify({ id: id }));
        } catch (e) {
            if (onFail) onFail();
        }
    };

    window.NativeShell = {
        AppHost: {
            init: function () { return Promise.resolve(AppInfo); },
            appName: function () { return AppInfo.appName; },
            appVersion: function () { return AppInfo.appVersion; },
            deviceId: function () { return AppInfo.deviceId; },
            deviceName: function () { return AppInfo.deviceName; },
            exit: function () {
                try { window.PalmSystem.platformBack(); } catch (e) { window.close(); }
            },
            getDefaultLayout: function () { return 'tv'; },
            getDeviceProfile: function (profileBuilder) {
                return profileBuilder({ enableMkvProgressive: false, enableSsaRender: true });
            },
            getSyncProfile: function (profileBuilder) {
                return profileBuilder({ enableMkvProgressive: false });
            },
            screen: function () {
                return deviceInfo.screenWidth ? { width: deviceInfo.screenWidth, height: deviceInfo.screenHeight } : null;
            },
            supports: function (command) {
                return !!command && SupportedFeatures.indexOf(command.toLowerCase()) !== -1;
            }
        },
        downloadFile: function () { },
        enableFullscreen: function () { },
        disableFullscreen: function () { },
        getPlugins: function () { return []; },
        openUrl: function () { },
        updateMediaSession: function () { },
        hideMediaSession: function () { }
    };
})();
