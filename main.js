var $ = require('jquery');
var Cookies = require('js-cookie');
require('jquery-modal');
var Helper = require('./helper.js');

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
            let $tr = Helper.c('tr', { class: "car" });
            $tr.append(Helper.c('td', { class: "car_model w3-large" }).text(car.model));
            $tr.append(Helper.c('td', { class: "car_spz" }).text(car.SPZ.substr(0, 3) + " " + car.SPZ.substr(3, 6)));
            $tr.append(Helper.c('td', { class: "car_vin" }).text(car.VIN));
            $tr.append(Helper.c('td', { class: "car_year" }).text(car.year));
            $tr.append(Helper.c('td').append(Helper.c('a', { class: 'car_entries', href: "#" }).text('Záznamy')));
            $tr.append(Helper.c('td', { class: "car_id", style: "display:none" }).text(car._id));
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
    // Show service entries
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
            var $table = Helper.c('table', { id: "serviceModal", class: "w3-table w3-striped w3-bordered" });
            let $thtr = Helper.c('tr');
            var ths = ['Servis', 'Mechanik', 'Datum', 'Cena', 'Popis', 'Účtenka'];
            ths.forEach((th) => {
                $thtr.append(Helper.c('th').text(th));
            });
            $table.append($thtr);
            var $modal = Helper.c('div');
            data.serviceBook.forEach(function (service) {
                let $tr = Helper.c('tr', { class: "service" });
                $tr.append(Helper.c('td', { class: "service_vendor" }).text(service.vendor));
                $tr.append(Helper.c('td', { class: "service_mechanic" }).text(service.mechanicName));
                $tr.append(Helper.c('td', { class: "service_date" }).text(new Date(service.date).toLocaleDateString()));
                $tr.append(Helper.c('td', { class: "service_cost" }).text(service.cost + " Kč"));
                $tr.append(Helper.c('td', { class: "service_description" }).text(service.description));
                $tr.append(Helper.c('td').append(Helper.c('a', { class: 'service_receipt', href: "#" }).text('Účtenka')));
                $tr.append(Helper.c('img', { src: "data:" + service.receipt.contentType + ";base64," + Helper.bufferToBase64(new Uint8Array(service.receipt.data.data)), style: "display:none" }));
                $tr.appendTo($table);
            });
            $table.appendTo($modal);
            $modal.modal();
        });
    });

    // Display receipt
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

    // Submit register modal
    $(document).on('click', 'input#register',
        () => {
            let data = Helper.parseForm('form#register');
            $.ajax({
                url: window.Servicio.baseURL + "/user/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: data
            }).done((res) => {
                if (res.success) {
                    $(Helper.c('div', { class: "success" }).text("Registrace úspěšná")).modal({
                        closeExisting: false
                    }).on($.modal.AFTER_CLOSE, function () {
                        $.modal.close();
                    });
                }
            }).fail((res) => {
                if (res.responseJSON.statusText == "Validation Error") {
                    $(Helper.c('div', { class: "error" }).text("Email se již používá")).modal({
                        closeExisting: false
                    });
                }
            });
        }
    );

    // Submit login modal
    $(document).on('click', 'input#login', () => {
        let data = Helper.parseForm('form#login');
        $.ajax({
            url: window.Servicio.baseURL + "/user/authenticate",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: data
        }).done((res) => {
            if (!res.success) {
                return;
            }

            $(Helper.c('div', { class: "success" }).text("Přihlášení úspěšné")).modal();

            window.Servicio.token = res.token;
            Cookies.set('servicio-apitoken', res.token);
            refresh();
        }).fail((d) => {
            let res = d.responseJSON;
            if (res.error == "BadPassword") {
                $(Helper.c('div', { class: "error" }).text("Špatné heslo")).modal({
                    closeExisting: false
                });
            } else if (res.error == "UserNotFound") {
                $(Helper.c('div', { class: "error" }).text("Uživatel neexistuje")).modal({
                    closeExisting: false
                });
            }
        });
    });

    // Logout
    $(document).on('click', 'a#logout', () => {
        $('div#login').modal();
        Cookies.remove('servicio-apitoken');
        window.Servicio.token = undefined;
    });

    // Add Car
    $(document).on('click', 'button#addCar', () => {
        $('div#addCar').modal();
    });

    // Submit addCar modal
    $(document).on('click', 'input#addCar', () => {
        let data = Helper.parseForm('form#addCar');
        $.ajax({
            url: window.Servicio.baseURL + "/user/cars",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
            },
            dataType: "json",
            data: data
        }).done((res) => {
            if (!res.success) {
                return;
            }

            $(Helper.c('div', { class: "success" }).text("Auto přidáno")).modal();
            refresh();
        });
    });
}