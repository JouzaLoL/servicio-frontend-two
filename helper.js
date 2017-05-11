var $ = require('jquery');

module.exports = {
    c: function (element, attributes) {
        const e = $(document.createElement(element));
        if (attributes) {
            e.attr(attributes);
        }
        return e;
    },
    parseForm: function (id) {
        return JSON.stringify(this.objectifyForm($(id).serializeArray()));
    },
    objectifyForm: function (formArray) {
        var returnArray = {};
        for (var i = 0; i < formArray.length; i++) {
            returnArray[formArray[i]['name']] = formArray[i]['value'];
        }
        return returnArray;
    },
    bufferToBase64: function (buf) {
        var binstr = Array.prototype.map.call(buf, function (ch) {
            return String.fromCharCode(ch);
        }).join('');
        return btoa(binstr);
    }
};