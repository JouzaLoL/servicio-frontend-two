var baseUrl = "https://servicio-api.herokuapp.com/api";
        function refresh() {
            let token;
            if (window.token) {
                token = window.token;
            } else if (Cookies.get('servicio-apitoken_vendor')) {
                token = Cookies.get('servicio-apitoken_vendor');
            } else {
                return false;
            }

            // Update Services list
            let $servicestable = $('table#services');
            let $servicestrs = $('tr.service');
            $servicestrs.remove();

            $.ajax({
                url: baseUrl + "/vendor/services",
                method: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Access-Token', token);
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done((data) => {
                data.services.forEach(function (service) {
                    let $tr = c('tr', { class: "service" });
                    $tr.append(c('td', { class: "car_model w3-large w3-margin-bottom" }).text(service.car.model));
                    $tr.append(c('td', { class: "car_spz w3-margin-right w3-monospace w3-large w3-border w3-padding-small w3-border-black" }).text(service.car.SPZ));
                    $tr.append(c('td', { class: "car_vin w3-margin-right w3-monospace w3-border w3-padding-small w3-border-black" }).text(service.car.VIN));
                    $tr.append(c('td', { class: "service_date" }).text("Datum: " + new Date(service.date).toLocaleDateString()));
                    $tr.append(c('td', { class: "service_vendor" }).text("Servis: " + service.vendor));
                    $tr.append(c('td', { class: "service_mechanic" }).text("Mechanik: " + service.mechanicName));
                    $tr.append(c('td', { class: "service_cost" }).text("Cena: " + service.cost + " Kč"));
                    $tr.append(c('td', { class: "service_description" }).text("Popis: " + service.description));
                    $tr.append(c('td').append(c('a', { class: 'service_receipt w3-right', href: "#" }).text('Účtenka')));
                    $tr.append(c('img', { src: "data:" + service.receipt.contentType + ";base64," + bufferToBase64(new Uint8Array(service.receipt.data.data)), style: "display:none" }));
                    $tr.appendTo($servicestable);
                });

                registerEvents();
            });

            // Update Profile
            $.ajax({
                url: baseUrl + "/vendor/",
                method: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-Access-Token', token);
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done((data) => {
                $('span#name').text(data.vendor.name);
                window._id = data.vendor._id;
            });
        }

        function registerEvents() {
            $('a.service_receipt').click((eventObject) => {
                eventObject.preventDefault();
                let img = $(eventObject.target).parent().parent().find('img').clone();
                $(img).modal();
            });
        }


        // Main entry point
        $(document).ready(() => {
            // Login or restore session from cookie
            if (!Cookies.get('servicio-apitoken_vendor')) {
                $('div#login').modal({
                    escapeClose: false,
                    clickClose: false,
                    showClose: false
                });
            } else {
                window.token = Cookies.get('servicio-apitoken_vendor');
                refresh();
            }

            $('a#register').click((e) => {
                e.preventDefault();
                $('div#register').modal({ closeExisting: false });
            });

            $('input#register').click(
                () => {
                    let data = parseForm('form#register');
                    $.ajax({
                        url: baseUrl + "/vendor/register",
                        method: "POST",
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: data
                    }).done((data) => {
                        if (data.success) {
                            $(c('div', { class: "success" }).text("Registrace úspěšná")).modal({
                                closeExisting: false
                            }).on($.modal.AFTER_CLOSE, function (event, modal) {
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

            $('input#login').click(() => {

                let data = parseForm('form#login');
                $.ajax({
                    url: baseUrl + "/vendor/authenticate",
                    method: "POST",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: data
                }).done((data) => {
                    if (!data.success) { return; }

                    $(c('div', { class: "success" }).text("Přihlášení úspěšné")).modal();

                    window.token = data.token;
                    Cookies.set('servicio-apitoken_vendor', data.token);
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

            $('a#logout').click(() => {
                $('div#login').modal();
                Cookies.remove('servicio-apitoken_vendor');
            });

            $('button#addService').click(() => {
                $('div#addService').modal();
            });

            $('input#addService').click(() => {
                let d = parseForm('form#addService');

                var reader = new FileReader();
                reader.readAsDataURL($('#file')[0].files[0]);
                reader.onload = () => {
                    let receipt = {
                        data: reader.result.split(',')[1],
                        contentType: $('#file')[0].files[0].type
                    };
                    let data = JSON.parse(d);
                    data.receipt = receipt;
                    data.vendorID = window._id;
                    data.date = new Date(data.date).toISOString()
                    $.ajax({
                        url: baseUrl + "/vendor/cars/search/" + data.SPZ,
                        method: "GET",
                        contentType: "application/json; charset=utf-8",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('X-Access-Token', window.token);
                        },
                        dataType: "json",
                    }).done((car) => {

                        $.ajax({
                            url: baseUrl + "/vendor/cars/" + car.car._id + "/services",
                            method: "POST",
                            contentType: "application/json; charset=utf-8",
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-Access-Token', window.token);
                            },
                            dataType: "json",
                            data: JSON.stringify(data)
                        }).done((res) => {
                            if (res.success) {
                                refresh();
                                $.modal.close();
                            }
                        });
                    });
                };
            });
        });