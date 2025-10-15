/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import VariantMixin from "@website_sale/js/variant_mixin";
import wSaleUtils from "@website_sale/js/website_sale_utils";
const cartHandlerMixin = wSaleUtils.cartHandlerMixin;
import { jsonrpc } from "@web/core/network/rpc_service";
import { debounce } from "@web/core/utils/timing";
import { listenSizeChange, SIZES, utils as uiUtils } from "@web/core/ui/ui_service";
import { _t } from "@web/core/l10n/translation";

publicWidget.Widget.include({
    start: function () {
        var self = this;
        this.acquirer_id = null;

        var checkout_autoformat = setInterval(function () {
            if ($('select[name="_state_id"]').length > 1) {
                $('select[name="_state_id"]').last().remove();
                $('select[name="municipality_id"]').last().remove();
            }
        }, 10);

        var checkout_autoformat = setInterval(function () {
            if ($("form.checkout_autoformat").length > 0) {
                $(document).ready(function () {
                    $("input[name='city']").val('');
                    $("select[name='state_id']").val('');

                    self.is_company();
                    self.assign_email();
                    self.assign_city();
                    self.define_events();
                    self.fields_display();
                    self.assign_document_type();
                    self.assign_zip();

                    if ($("select[name='_state_id'] option").length == 1) {
                        var company_name = $("input[name='company_name']").closest("div").clone();
                        $("input[name='vat']").closest("div").after(company_name);
                        $("input[name='company_name']").first().closest("div").remove();
                    }

                    $('select[name="country_id"] option:contains("' + String('Colombia') + '")').prop('selected', true);
                    $('select[name="country_id"] option:contains("' + String('哥伦比亚') + '")').prop('selected', true);

                    if ($("select[name='_state_id'] option").length == 1) {
                        self.fill_departments();
                        self.fill_districts();
                        self.assign_default_state();
                        $("input[name='name']").click();
                        $("input[name='company_name']").closest("div").hide();
                        $("form.checkout_autoformat").slideDown('slow');
                    }

                    clearInterval(checkout_autoformat);
                });
            }
        }, 10);

        return this._super.apply(this, arguments);
    },

    is_company: function() {
        $('input[name="is_company"]').val('false');
    },

    verify_document_number: function() {
        var self = this;
        var vat = $('input[name="vat"]').val();
        var partner_id = $('input[name="partner_id"]').val();

        if (String(vat) > 0) {
            var data = {
                "params": {'vat': vat, 'partner_id': partner_id}
            };
            $.ajax({
                type: "POST",
                url: '/contact/verify_document_number',
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: "application/json",
                async: false,
                success: function(counter) {
                    counter = counter.result;
                    if (counter > 0) {
                        $('input[name="vat"]').val('');
                        self.displayNotification({
                            title: _t("Error"),
                            message: _t("Numero de identificación existente, asignar uno diferente."),
                            type: 'danger',
                        });
                    }
                }
            });
        }
    },

    verify_email: function() {
        var self = this;
        var email = $('input[name="email"]').val();
        var partner_id = $('input[name="partner_id"]').val();

        if (String(email).length > 0) {
            var data = {
                "params": {'email': email, 'partner_id': partner_id}
            }
            $.ajax({
                type: "POST",
                url: '/contact/verify_email',
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: "application/json",
                async: false,
                success: function(counter) {
                    counter = counter.result;
                    if (counter > 0) {
                        $('input[name="email"]').val('');
                        self.displayNotification({
                            title: _t("Error"),
                            message: _t("Correo electrónico existente, asignar uno diferente."),
                            type: 'danger',
                        });
                    }
                }
            });
        }
    },

    assign_email: function() {
        var self = this;
        var email = $("input[name='email']").val();
        $("input[name='email_edi']").val(email);
    },

    assign_city: function() {
        var self = this;
        var city = String($("select[name='municipality_id'] option:selected").text()).trim();
        $("input[name='city']").val(city);
    },

    assign_default_state: function() {
        var self = this;
        var _state_name = String($("select[name='_state_id'] option:selected").text()).trim();
        $('select[name="state_id"] option:contains("' + String(_state_name) + '")').prop('selected', true);
    },

    assign_document_type: function() {
        var self = this;
        var l10n_latam_identification_type_id = $("select[name='l10n_latam_identification_type_id_maskared']").val();
        var verification_code = $("input[name='verification_code']").val();

        if (String(l10n_latam_identification_type_id) == String("31")) {
            $("input[name='vat']").addClass("vat_nit");
            $("input[name='verification_code']").removeClass("hidden_field");
            $("input[name='verification_code']").fadeIn();
            $("input[name='company_name']").closest("div").fadeIn();
            $('input[name="is_company"]').val('true');
            $('input[name="company_type"]').val('company');
        } else {
            $("input[name='vat']").removeClass("vat_nit");
            $("input[name='vat']").addClass("vat_no_nit");
            $("input[name='verification_code']").addClass("hidden_field");
            $("input[name='verification_code']").hide();
            $("input[name='company_name']").closest("div").hide();
            $('input[name="is_company"]').val('false');
            $('input[name="company_type"]').val('person');
        }
        self.assign_document_type_id();
    },

    assign_document_type_id: function() {
        var code = String($("select[name='l10n_latam_identification_type_id_maskared'] option:selected").val()).trim();

        if (String(code).length > 0) {
            var data = {
                "params": {'code': code}
            }
            $.ajax({
                type: "POST",
                url: '/identification/document_type_id',
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: "application/json",
                async: false,
                success: function(document_type) {
                    document_type = document_type.result;
                    $("input[name='l10n_latam_identification_type_id']").val(document_type.id);                                        
                }
            });
        }
    },

    define_events: function () {
        var self = this;

        $("select[name='l10n_latam_identification_type_id_maskared']").off("change");
        $("select[name='l10n_latam_identification_type_id_maskared']").on("change", function () {
            self.assign_document_type();
        });

        $("select[name='_state_id']").off("change");
        $("select[name='_state_id']").on("change", function () {
            self.fill_districts();
            self.assign_zip();
            self.assign_default_state();
        });

        $("select[name='municipality_id']").off("change");
        $("select[name='municipality_id']").on("change", function () {
            self.assign_zip();
            self.assign_city();
        });

        $("select[name='country_id']").off("change");
        $("select[name='country_id']").on("change", function () {
            const country_name = String($("select[name='country_id'] option:selected").text()).trim();
            if (country_name == "Colombia" || country_name == "哥伦比亚") {
                self.fill_departments();
                self.fill_districts();
                self.assign_zip();
                $("div.div_city").last().removeClass("d-none").fadeIn("fast");
                $("div.div_zip").last().removeClass("d-none").fadeIn("fast");
                $("select[name=_state_id]").last().removeClass("d-none").fadeIn("fast");
                $("select[name=state_id]").last().addClass("d-none").fadeIn("fast");
            } else {
                $("select[name=state_id]").last().removeClass("d-none").fadeIn("fast");
                $("div.div_city").last().addClass("d-none").hide("fast");
                $("div.div_zip").last().addClass("d-none").hide("fast");
                $("select[name=_state_id]").last().addClass("d-none").fadeIn("fast");
            }
        });

        $("input[name='vat']").off("input");
        $("input[name='vat']").on("input", function () {
            self.assign_verification_code();
        });

        $("input[name='vat']").off();
        $("input[name='vat']").on("blur", function () {
            self.assign_verification_code();
            self.verify_document_number();
        });

        $("input[name='email']").off("blur");
        $("input[name='email']").on("blur", function () {
            self.assign_email();
            self.verify_email();
        });

        $("input[name='name']").off("click");
        $("input[name='name']").on("click", function () {
            self.set_client();
        });
    },

    fields_display: function () {
        var country_name = String($("select[name='country_id'] option:selected").text()).trim();

        if (String(country_name) == String('Colombia') || String(country_name) == String("哥伦比亚")) {                    
            $("select[name='state_id']").hide();
            $("input[name='city']").hide();
            $("select[name='_state_id']").fadeIn();
        } else {
            $("select[name='_state_id']").hide();
            $("input[name='city']").fadeIn();
            $("select[name='state_id']").fadeIn();
        }
    },

    assign_zip: function () {        
        var code = $("select[name='municipality_id'] option:selected").attr('code');
        $("input[name='zip']").val(code);
    },

    assign_verification_code: function() {
        var self = this;
        var vat = $("input[name='vat']").val();
        var verification_code = self.get_verification_code(vat);
        $("input[name='verification_code']").val(verification_code);
    },

    set_client: function () {
        var self = this;
        var partner_id = $("input[name='partner_id']").val();

        var data = {
            "params": {'partner_id': partner_id}
        }

        try {
            $.ajax({
                type: "POST",
                url: '/location/get_partner_id',
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: "application/json",
                async: false,
                success: function(response) {
                    try {
                        var partner = response.result.contact[0];
                        var identy = response.result.identy_invoice_code;
                        var _state_id = partner['_state_id'][0];
                        var is_company = partner['is_company'][0];
                        var municipality_id = partner['municipality_id'][0];
                        var identification_id = partner['l10n_latam_identification_type_id'][0];

                        $('input[name="is_company"]').val(is_company);

                        $("select[name='_state_id']").val(_state_id);
                        $("select[name='_state_id']").trigger('change');
                        $("select[name='municipality_id']").val(municipality_id); 
                        $('select[name="l10n_latam_identification_type_id"]').val(identification_id);
                        $('select[name="l10n_latam_identification_type_id_maskared"]').val(identy);

                        self.assign_document_type();
                    } catch(error) {
                        console.log(error);
                    }
                }
            });
        } catch(error) {
            console.log(error);
        }
    },

    fill_departments: function () {
        var data = {
            "params": {}
        }
        $.ajax({
            type: "POST",
            url: '/location/get_departments',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: "application/json",
            async: false,
            success: function(response) {
                var _departments = [];
                var options = String('<option value="">Departamento</option>');

                try {
                    _departments = response.result;
                    _departments.forEach(function(department) {
                        var id = String(department.id);
                        var name = String(department.name);
                        var option = "<option value='" + String(id) + "'>" + String(name) + "</option>";
                        options = String(options) + String(option);
                    });
                    $("select[name='_state_id']").html(options);
                } catch(event) {
                    console.log(event);
                }
            }
        });
    },

    fill_districts: function () {
        var department_id = $("select[name='_state_id']").val();
        var data = {
            "params": {'department_id': department_id}
        };

        $.ajax({
            type: "POST",
            url: '/location/get_districts',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: "application/json",
            async: false,
            success: function(response) {
                try {
                    var districts = response.result; 
                    var options = String("<option value=''>Municipio</option>");

                    districts.forEach(function(district) {
                        var id = String(district.id);
                        var name = String(district.name);
                        var code = String(district.code);

                        var option = "<option value='" + String(id) + "' code='" + String(code) + "'>" + String(name) + "</option>";
                        options = String(options) + String(option);
                    });
                    $("select[name='municipality_id']").html(options);
                } catch(error) {
                    console.log(error);
                }
            }
        });            
    },

    get_verification_code:function(document_number) {
        var vpri,
            x,
            y,
            z;

        document_number = document_number.replace(/\s/g, "");
        document_number = document_number.replace(/,/g, "");
        document_number = document_number.replace(/\./g, "");
        document_number = document_number.replace(/-/g, "");

        if (isNaN(document_number)) {
            console.log("El NIT'" + document_number + "' no es válido.");
            return "";
        };

        vpri = new Array(16);
        z = document_number.length;

        vpri[1] = 3;
        vpri[2] = 7;
        vpri[3] = 13;
        vpri[4] = 17;
        vpri[5] = 19;
        vpri[6] = 23;
        vpri[7] = 29;
        vpri[8] = 37;
        vpri[9] = 41;
        vpri[10] = 43;
        vpri[11] = 47;
        vpri[12] = 53;
        vpri[13] = 59;
        vpri[14] = 67;
        vpri[15] = 71;

        x = 0;
        y = 0;

        for (var i = 0; i < z; i++) {
            y = (document_number.substr(i, 1));
            x += (y * vpri[z - i]);  
        }

        y = x % 11;

        return (y > 1) ? 11 - y : y;
    }
});
