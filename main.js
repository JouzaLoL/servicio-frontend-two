var $ = require('jquery');
var Cookies = require('js-cookie');
require('jquery-modal');

$(document).ready(() => {
    init();

    // Login or restore session from cookie
    if (!Cookies.get('servicio-apitoken')) {
        $('div#login').modal({
            escapeClose: false,
            clickClose: false,
            showClose: false
        });
    } else {
        window.Servicio.token = Cookies.get('servicio-apitoken');
        refresh();
    }
});

function refresh() {

    updateCars();
    updateProfile();

}

function init() {
    window.Servicio = {};
    window.Servicio.baseURL = "https://servicio-api.herokuapp.com/api";
    registerEvents();
}

function updateCars() {
    let $cartable = $('table#cars');
    let $cartrs = $('tr.car');
    $cartrs.remove();

    $.ajax({
        url: window.Servicio.baseURL + "/user/cars",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        data.cars.forEach(function (car) {
            let $tr = c('tr', { class: "car" });
            $tr.append(c('td', { class: "car_model w3-large w3-margin-bottom" }).text(car.model));
            $tr.append(c('br'));
            $tr.append(c('td', { class: "car_spz w3-margin-right w3-monospace w3-large w3-border w3-padding-small w3-border-black" }).text(car.SPZ));
            $tr.append(c('td', { class: "car_vin w3-margin-right w3-monospace w3-border w3-padding-small w3-border-black" }).text(car.VIN));
            $tr.append(c('td', { class: "car_year" }).text("Rok: " + car.year));
            $tr.append(c('td').append(c('a', { class: 'car_entries  w3-padding', href: "#" }).text('Záznamy')));
            $tr.append(c('td', { class: "car_id", style: "display:none" }).text(car._id));
            $tr.appendTo($cartable);
        });
    });
}

function updateProfile() {
    $.ajax({
        url: window.Servicio.baseURL + "/user/",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        $('span#name').text(data.user.name);
    });
}

function registerEvents() {
    // Display Car's Service Entries
    $(document).on('click', 'a.car_entries', (eventObject) => {
        eventObject.preventDefault();
        let id = $(eventObject.target).parent().parent().find('.car_id').text();
        $.ajax({
            url: window.Servicio.baseURL + "/user/cars/" + id + "/services",
            method: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done((data) => {
            var $table = c('table', { id: "serviceModal", class: "w3-table w3-striped w3-bordered" });
            var $modal = c('div');
            data.serviceBook.forEach(function (service) {
                let $tr = c('tr', { class: "service" });
                $tr.append(c('td', { class: "service_vendor" }).text("Servis: " + service.vendor));
                $tr.append(c('td', { class: "service_mechanic" }).text("Mechanik: " + service.mechanicName));
                $tr.append(c('td', { class: "service_date" }).text("Datum: " + new Date(service.date).toLocaleDateString()));
                $tr.append(c('td', { class: "service_cost" }).text("Cena: " + service.cost + " Kč"));
                $tr.append(c('td', { class: "service_description" }).text("Popis: " + service.description));
                $tr.append(c('td').append(c('a', { class: 'service_receipt w3-right', href: "#" }).text('Účtenka')));
                $tr.append(c('img', { src: "data:" + service.receipt.contentType + ";base64," + bufferToBase64(new Uint8Array(service.receipt.data.data)), style: "display:none" }));
                $tr.appendTo($table);
            });
            $table.appendTo($modal);
            $modal.modal();
        });
    });

    // Display Service's Receipt
    $(document).on('click', 'a.service_receipt', (eventObject) => {
        eventObject.preventDefault();
        let img = $(eventObject.target).parent().parent().find('img').clone();
        $(img).modal({ closeExisting: false });
    });

    // Show register modal
    $(document).on('click', 'a#register', (e) => {
        e.preventDefault();
        $('div#register').modal({ closeExisting: false });
    });

    // Submit inside register modal
    $(document).on('click', 'input#register',
        () => {
            let data = parseForm('form#register');
            $.ajax({
                url: window.Servicio.baseURL + "/user/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: data
            }).done((data) => {
                if (data.success) {
                    $(c('div', { class: "success" }).text("Registrace úspěšná")).modal({
                        closeExisting: false
                    }).on($.modal.AFTER_CLOSE, function () {
                        $.modal.close();
                    });
                }
            }).fail((data) => {
                if (data.responseJSON.statusText == "Validation Error") {
                    $(c('div', { class: "error" }).text("Email se již používá")).modal({
                        closeExisting: false
                    });
                }
            });
        }
    );

    // Submit inside LOGIN modal
    $(document).on('click', 'input#login', () => {

        let data = parseForm('form#login');
        $.ajax({
            url: window.Servicio.baseURL + "/user/authenticate",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: data
        }).done((data) => {
            if (!data.success) { return; }

            $(c('div', { class: "success" }).text("Přihlášení úspěšné")).modal();

            window.Servicio.token = data.token;
            Cookies.set('servicio-apitoken', data.token);
            refresh();

        }).fail((d) => {
            let data = d.responseJSON;
            if (data.error == "BadPassword") {
                $(c('div', { class: "error" }).text("Špatné heslo")).modal({
                    closeExisting: false
                });
            } else if (data.error == "UserNotFound") {
                $(c('div', { class: "error" }).text("Uživatel neexistuje")).modal({
                    closeExisting: false
                });
            }
        });
    });

    // Click on logout
    $(document).on('click', 'a#logout', () => {
        $('div#login').modal();
        Cookies.remove('servicio-apitoken');
        window.Servicio.token = undefined;
    });

    // Click on addCar
    $(document).on('click', 'button#addCar', () => {
        $('div#addCar').modal();
    });

    // Submit inside addCar modal
    $(document).on('click', 'input#addCar', () => {
        let data = parseForm('form#addCar');
        $.ajax({
            url: window.Servicio.baseURL + "/user/cars",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
            },
            dataType: "json",
            data: data
        }).done((data) => {
            if (!data.success) { return; }

            $(c('div', { class: "success" }).text("Auto přidáno")).modal();
            refresh();

        });
    });
}

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

function bufferToBase64(buf) {
    var binstr = Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
    return btoa(binstr);
}