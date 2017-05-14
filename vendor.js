var $ = require('jquery');
var Cookies = require('js-cookie');
require('jquery-modal');
var Helper = require('./helper.js');

$(document).ready(() => {
    init();

    // Login or restore session from cookie
    if (!Cookies.get('servicio-apitoken_vendor')) {
        $('div#login').modal({
            escapeClose: false,
            clickClose: false,
            showClose: false
        });
    } else {
        window.Servicio.token = Cookies.get('servicio-apitoken_vendor');
        refresh();
    }
});

function init() {
    window.Servicio = {};
    window.Servicio.baseURL = "https://servicio-api.herokuapp.com/api";
    registerEvents();
}

function refresh() {
    updateProfile();
    updateServices();
}

function updateServices() {
    let $servicestable = $('table#services');
    let $servicestrs = $('tr.service');
    $servicestrs.remove();

    $.ajax({
        url: window.Servicio.baseURL + "/vendor/services",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        data.services.forEach(function (service) {
            let $tr = Helper.c('tr', { class: "service" });
            $tr.append(Helper.c('td', { class: "car_model w3-large" }).text(service.car.model));
            $tr.append(Helper.c('td', { class: "car_spz" }).text(service.car.SPZ));
            $tr.append(Helper.c('td', { class: "car_vin" }).text(service.car.VIN));
            $tr.append(Helper.c('td', { class: "service_date" }).text(new Date(service.date).toLocaleDateString()));
            $tr.append(Helper.c('td', { class: "service_vendor" }).text(service.vendor));
            $tr.append(Helper.c('td', { class: "service_mechanic" }).text(service.mechanicName));
            $tr.append(Helper.c('td', { class: "service_cost" }).text(service.cost + " Kč"));
            $tr.append(Helper.c('td', { class: "service_description" }).text(service.description));
            $tr.append(Helper.c('td').append(Helper.c('a', { class: 'service_receipt w3-right', href: "#" }).text('Účtenka')));
            $tr.append(Helper.c('img', { src: "data:" + service.receipt.contentType + ";base64," + Helper.bufferToBase64(new Uint8Array(service.receipt.data.data)), style: "display:none" }));
            $tr.appendTo($servicestable);
        });
    });
}

function updateProfile() {
    $.ajax({
        url: window.Servicio.baseURL + "/vendor/",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        $('span#name').text(data.vendor.name);
        window.Servicio._id = data.vendor._id;
    });
}

function registerEvents() {
    $(document).on('click', 'a.service_receipt', (eventObject) => {
        eventObject.preventDefault();
        let img = $(eventObject.target).parent().parent().find('img').clone();
        $(img).modal();
    });

    $(document).on('click', 'a#register', (e) => {
        e.preventDefault();
        $('div#register').modal({ closeExisting: false });
    });

    $(document).on('click', 'input#register',
        () => {
            let data = Helper.parseForm('form#register');
            $.ajax({
                url: window.Servicio.baseURL + "/vendor/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: data
            }).done((res) => {
                if (res.success) {
                    $(Helper.c('div', { class: "success" }).text("Registrace úspěšná")).modal();
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

    $(document).on('click', 'button#addUser', (e) => {
        e.preventDefault();
        $('div#userRegister').modal();
    });

    $(document).on('click', 'input#userRegister',
        () => {
            let data = Helper.parseForm('form#userRegister');
            $.ajax({
                url: window.Servicio.baseURL + "/vendor/user/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: data
            }).done((res) => {
                if (res.success) {
                    $(Helper.c('div', { class: "success" }).text("Registrace uživatele úspěšná")).modal();
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

    $(document).on('click', 'input#login', () => {
        let data = Helper.parseForm('form#login');
        $.ajax({
            url: window.Servicio.baseURL + "/vendor/authenticate",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: data
        }).done((res) => {
            $(Helper.c('div', { class: "success" }).text("Přihlášení úspěšné")).modal();
            Cookies.set('servicio-apitoken_vendor', res.token);
            window.Servicio.token = Cookies.get('servicio-apitoken_vendor');
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

    $(document).on('click', 'a#logout', () => {
        Cookies.remove('servicio-apitoken_vendor');
        $('div#login').modal();
    });

    $(document).on('click', 'button#addService', () => {
        $('div#addService').modal();
    });

    $(document).on('click', 'input#addService', () => {
        let d = Helper.parseForm('form#addService');

        var reader = new FileReader();
        reader.readAsDataURL($('#file')[0].files[0]);
        reader.onload = () => {
            let receipt = {
                data: reader.result.split(',')[1],
                contentType: $('#file')[0].files[0].type
            };
            let data = JSON.parse(d);
            data.receipt = receipt;
            data.vendorID = window.Servicio._id;
            data.date = new Date(data.date).toISOString();
            $.ajax({
                url: window.Servicio.baseURL + "/vendor/cars/search/" + data.SPZ,
                method: "GET",
                contentType: "application/json; charset=utf-8",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Access-Token', window.window.Servicio.token);
                },
                dataType: "json",
            }).done((car) => {
                $.ajax({
                    url: window.Servicio.baseURL + "/vendor/cars/" + car.car._id + "/services",
                    method: "POST",
                    contentType: "application/json; charset=utf-8",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-Access-Token', window.window.Servicio.token);
                    },
                    dataType: "json",
                    data: JSON.stringify(data)
                }).done((res) => {
                    $(Helper.c('div', { class: "success" }).text("Záznam úspěšně přidán")).modal();
                    refresh();
                });
            });
        };
    });
}