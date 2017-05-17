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
    },
    hrdate: function (date) {
        var datum = new Date(date); // aktuální datum
        var denVTydnu = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
        var retezec = "";
        retezec += denVTydnu[datum.getDay()] + ", "; // Den v týdnu
        retezec += datum.getDate() + ". "; // Den v měsíci
        retezec += (1 + datum.getMonth()) + ". "; // Měsíce jsou číslovány od nuly
        retezec += datum.getFullYear() + " "; // Rok ve formátu 0000
        retezec += datum.getHours() + ":"; // Hodiny
        retezec += datum.getMinutes(); // Minuty
        return retezec;
    }
};