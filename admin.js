var $ = require('jquery');
var Cookies = require('js-cookie');
require('jquery-modal');
var Helper = require('./helper.js');

$(document).ready(() => {
    init();

    // Login or restore session from cookie
    if (!Cookies.get('servicio-apitoken_admin')) {
        $('div#login').modal({
            escapeClose: false,
            clickClose: false,
            showClose: false
        });
    } else {
        window.Servicio.token = Cookies.get('servicio-apitoken_admin');
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
    updateUsers();
    updateVendors();
}

function updateProfile() {
    $.ajax({
        url: window.Servicio.baseURL + "/admin/",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        $('span#name').text(data.name);
    });
}

function updateUsers() {
    let $userstable = $('table#users');
    let $usertrs = $('tr.user');
    $usertrs.remove();

    $.ajax({
        url: window.Servicio.baseURL + "/admin/user/",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        data.forEach(function (user) {
            let $tr = Helper.c('tr', { class: "user" });
            $tr.append(Helper.c('td', { class: "user_name" }).text(user.name));
            $tr.append(Helper.c('td', { class: "user_email" }).text(user.email));
            $tr.append(Helper.c('td', { class: "user_createdAt" }).text(Helper.hrdate(user.createdAt)));
            $tr.append(Helper.c('td', { class: "user_updatedAt" }).text(Helper.hrdate(user.updatedAt)));
            $tr.appendTo($userstable);
        });
    });
}

function updateVendors() {
    let $vendorstable = $('table#vendors');
    let $vendortrs = $('tr.vendor');
    $vendortrs.remove();

    $.ajax({
        url: window.Servicio.baseURL + "/admin/vendor/",
        method: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json"
    }).done((data) => {
        data.forEach(function (vendor) {
            let $tr = Helper.c('tr', { class: "vendor" });
            $tr.append(Helper.c('td', { class: "vendor_name" }).text(vendor.name));
            $tr.append(Helper.c('td', { class: "vendor_email" }).text(vendor.email));
            $tr.append(Helper.c('td', { class: "vendor_createdAt" }).text(Helper.hrdate(vendor.createdAt)));
            $tr.append(Helper.c('td', { class: "vendor_updatedAt" }).text(Helper.hrdate(vendor.updatedAt)));
            $tr.appendTo($vendorstable);
        });
    });
}

function registerEvents() {
    $(document).on('click', 'button#addUser', (e) => {
        e.preventDefault();
        $('div#userRegister').modal();
    });

    $(document).on('click', 'input#userRegister',
        () => {
            let data = Helper.parseForm('form#userRegister');
            $.ajax({
                url: window.Servicio.baseURL + "/admin/user/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
                },
                dataType: "json",
                data: data
            }).done((res) => {
                if (res.success) {
                    $(Helper.c('div', { class: "success" }).text("Registrace uživatele úspěšná")).modal();
                    refresh();
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

    $(document).on('click', 'button#addVendor', (e) => {
        e.preventDefault();
        $('div#vendorRegister').modal();
    });

    $(document).on('click', 'input#vendorRegister',
        () => {
            let data = Helper.parseForm('form#vendorRegister');
            $.ajax({
                url: window.Servicio.baseURL + "/admin/vendor/register",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Access-Token', window.Servicio.token);
                },
                dataType: "json",
                data: data
            }).done((res) => {
                if (res.success) {
                    $(Helper.c('div', { class: "success" }).text("Registrace servisu úspěšná")).modal();
                    refresh();
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
            url: window.Servicio.baseURL + "/admin/authenticate",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: data
        }).done((res) => {
            $(Helper.c('div', { class: "success" }).text("Přihlášení úspěšné")).modal();
            Cookies.set('servicio-apitoken_admin', res.token);
            window.Servicio.token = Cookies.get('servicio-apitoken_admin');
            refresh();
        }).fail((d) => {
            let res = d.responseJSON;
            if (res.code === 102) {
                $(Helper.c('div', { class: "error" }).text("Špatné heslo")).modal({
                    closeExisting: false
                });
            }
        });
    });

    $(document).on('click', 'a#logout', () => {
        Cookies.remove('servicio-apitoken_admin');
        $('div#login').modal();
    });
}