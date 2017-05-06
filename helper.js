function c(element, attributes) {
    const e = $(document.createElement(element));
    if (attributes) {
        e.attr(attributes);
    }
    return e;
}

function parseForm(id) {
    return JSON.stringify(objectifyForm($(id).serializeArray()));
}

function objectifyForm(formArray) {

    var returnArray = {};
    for (var i = 0; i < formArray.length; i++) {
        returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
}