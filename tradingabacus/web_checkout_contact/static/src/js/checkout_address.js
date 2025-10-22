/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.websiteSaleAddress.include({
    events: Object.assign({}, publicWidget.registry.websiteSaleAddress.prototype.events || {}, {
        'change select[name="l10n_latam_identification_type_id_maskared"]': '_onIdentificationTypeChange',
        'change select[name="_state_id"]': '_onDepartmentChange',
        'change select[name="municipality_id"]': '_onMunicipalityChange',
        'blur input[name="vat"]': '_onVatBlur',
    }),

    /**
     * @override
     */
    start: function () {
        const result = this._super.apply(this, arguments);
        
        console.log('[WEB_CHECKOUT_CONTACT] Extended widget started');
        
        // Auto-select Colombia by default (support both Spanish and Chinese names)
        this._autoSelectColombia();
        
        // Initialize departments for Colombia
        this._fillDepartments();
        
        // Initial visibility check
        this._handleInitialVisibility();
        
        // Initial identification type check
        this._handleIdentificationTypeVisibility();
        
        // Initial cascading fields check for Colombia
        this._handleColombiaCascade();
        
        return result;
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Override parent _changeCountry method
     * @override
     */
    _changeCountry: async function () {
        console.log('[WEB_CHECKOUT_CONTACT] _changeCountry called');
        
        // Call parent implementation first
        await this._super(...arguments);
        
        // Get selected country code
        const countrySelect = this.$("select[name='country_id']");
        const countryCode = countrySelect.find('option:selected').attr('code');
        
        console.log('[WEB_CHECKOUT_CONTACT] Country code changed to:', countryCode);
        
        // Reset field values when changing country
        this._resetFieldValues(countryCode);
        
        // Apply country-specific visibility
        this._applyCountrySpecificVisibility(countryCode);
        
        // If Colombia, handle cascade and fill departments
        if (countryCode === 'CO') {
            this._fillDepartments();
            this._handleColombiaCascade();
        }
    },

    /**
     * Handle identification type change
     * @private
     */
    _onIdentificationTypeChange: function (ev) {
        console.log('[WEB_CHECKOUT_CONTACT] Identification type changed');
        this._handleIdentificationTypeVisibility();
        this._assignDocumentTypeId();
    },

    /**
     * Handle department change (Colombia only)
     * @private
     */
    _onDepartmentChange: function (ev) {
        console.log('[WEB_CHECKOUT_CONTACT] Department changed');
        this._fillDistricts();
        this._handleColombiaCascade();
    },

    /**
     * Handle municipality change (Colombia only)
     * @private
     */
    _onMunicipalityChange: function (ev) {
        console.log('[WEB_CHECKOUT_CONTACT] Municipality changed');
        this._assignZipCode();
        this._assignCityName();
        this._handleColombiaCascade();
    },

    /**
     * Handle VAT input blur - calculate verification code
     * @private
     */
    _onVatBlur: function (ev) {
        console.log('[WEB_CHECKOUT_CONTACT] VAT blur - calculating verification code');
        this._assignVerificationCode();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Check initial state and hide fields if no country selected
     * IMPORTANT: NEVER hide identification fields (div_vat, l10n_latam_identification_type_id_maskared, verification_code)
     * @private
     */
    _handleInitialVisibility: function () {
        const countrySelect = this.$("select[name='country_id']");
        const currentCountry = countrySelect.val();
        const countryCode = countrySelect.find('option:selected').attr('code');
        
        console.log('[WEB_CHECKOUT_CONTACT] Current country:', currentCountry, 'Code:', countryCode);
        
        // ALWAYS ensure identification fields are visible
        this._ensureIdentificationFieldsVisible();
        
        if (!currentCountry || currentCountry === "") {
            console.log('[WEB_CHECKOUT_CONTACT] No country selected - hiding address fields');
            this._hideAllAddressFields();
        } else {
            console.log('[WEB_CHECKOUT_CONTACT] Country selected - applying country-specific visibility');
            this._applyCountrySpecificVisibility(countryCode);
        }
    },

    /**
     * Ensures identification fields are ALWAYS visible
     * These fields should NEVER be hidden regardless of country selection
     * Uses .css() to force display and override any inline styles
     * @private
     */
    _ensureIdentificationFieldsVisible: function () {
        console.log('[WEB_CHECKOUT_CONTACT] Forcing identification fields to be visible');
        
        const identificationContainers = [
            '#div_vat',  // Contenedor principal de identificación
        ];
        
        identificationContainers.forEach(containerId => {
            const container = this.$(containerId);
            if (container.length > 0) {
                // Forzar display con .css() para sobrescribir inline styles
                container.css('display', 'block');
                container.show();
                console.log(`  - FORCED visible: ${containerId}`);
            } else {
                console.log(`  - WARNING: Container ${containerId} not found!`);
            }
        });
        
        // Asegurar que el select de tipo de identificación también sea visible
        const idTypeSelect = this.$("select[name='l10n_latam_identification_type_id_maskared']");
        if (idTypeSelect.length > 0) {
            idTypeSelect.css('display', 'block');
            idTypeSelect.show();
            idTypeSelect.parent().css('display', 'block');
            idTypeSelect.parent().show();
            console.log('  - FORCED visible: identification type select');
        }
    },

    /**
     * Hides all address fields that depend on a country selection.
     * Hides the complete DIV containers (with labels) using their IDs.
     * @private
     */
    _hideAllAddressFields: function () {
        console.log('[WEB_CHECKOUT_CONTACT] Hiding all address field containers');
        
        const containerIds = [
            '#div_state',           // Estado / Provincia (otros países)
            '#div_state_colombia',  // Departamento (Colombia)
            '#div_city',            // Ciudad / Municipio
            '#div_zip'              // Código Postal
        ];
        
        containerIds.forEach(containerId => {
            const container = this.$(containerId);
            if (container.length > 0) {
                container.hide();
                console.log(`  - Hidden container: ${containerId}`);
            } else {
                console.log(`  - WARNING: Container not found: ${containerId}`);
            }
        });
    },

    /**
     * Shows address fields when country is selected.
     * Shows the complete DIV containers (with labels) using their IDs.
     * @private
     */
    _showAddressFields: function () {
        console.log('[WEB_CHECKOUT_CONTACT] Showing address field containers');
        
        const containerIds = [
            '#div_state',           // Estado / Provincia (otros países)
            '#div_state_colombia',  // Departamento (Colombia)
            '#div_city',            // Ciudad / Municipio
            '#div_zip'              // Código Postal
        ];
        
        containerIds.forEach(containerId => {
            const container = this.$(containerId);
            if (container.length > 0) {
                container.show();
                console.log(`  - Showed container: ${containerId}`);
            }
        });
    },

    /**
     * Reset field values when changing country
     * @private
     */
    _resetFieldValues: function (countryCode) {
        console.log('[WEB_CHECKOUT_CONTACT] Resetting field values for country:', countryCode);
        
        const isColombia = countryCode === 'CO';
        
        if (isColombia) {
            // Reset Colombian fields
            this.$("select[name='_state_id']").val('');
            this.$("select[name='municipality_id']").val('');
            this.$("input[name='zip']").val('');
            console.log('[WEB_CHECKOUT_CONTACT] Colombian fields reset');
        } else {
            // Reset standard fields
            this.$("select[name='state_id']").val('');
            this.$("input[name='city']").val('');
            this.$("input[name='zip']").val('');
            console.log('[WEB_CHECKOUT_CONTACT] Standard fields reset');
        }
    },

    /**
     * Apply country-specific field visibility
     * For Colombia: Show _state_id (Departamento), hide state_id
     * For others: Show state_id, hide _state_id
     * IMPORTANT: Both selects are in the same div_state container
     * @private
     */
    _applyCountrySpecificVisibility: function (countryCode) {
        console.log('[WEB_CHECKOUT_CONTACT] Applying country-specific visibility for:', countryCode);
        
        const isColombia = countryCode === 'CO';
        
        // Contenedor único que contiene ambos selectores
        const divState = this.$('#div_state');
        const divCity = this.$('#div_city');
        const divZip = this.$('#div_zip');
        
        // Selectores dentro de divState (ambos en el mismo contenedor)
        const selectStateId = this.$("select[name='state_id']");
        const selectStateIdColombia = this.$("select[name='_state_id']");
        const labelState = divState.find('label');
        
        // Selectores dentro de divCity
        const inputCity = this.$("input[name='city']");
        const selectMunicipality = this.$("select[name='municipality_id']");
        
        // Input zip
        const zipInput = this.$("input[name='zip']");
        
        if (isColombia) {
            console.log('[WEB_CHECKOUT_CONTACT] Colombia selected - showing Colombian fields');
            
            // Mantener div_state visible pero cambiar el contenido
            divState.show();
            divState.css('display', 'block');
            
            // Cambiar label a "Departamento"
            labelState.text('Departamento');
            
            // Ocultar state_id estándar, mostrar _state_id Colombia
            selectStateId.hide();
            selectStateId.css('display', 'none');
            selectStateIdColombia.show();
            selectStateIdColombia.css('display', 'block');
            
            // En divCity: mostrar municipality_id, ocultar city input
            divCity.show();
            inputCity.hide();
            inputCity.css('display', 'none');
            selectMunicipality.show();
            selectMunicipality.css('display', 'block');
            
            // Cambiar label de city a "Municipio"
            divCity.find('label').text('Municipio');
            
            // Mostrar zip (será deshabilitado en cascade)
            divZip.show();
            
            // Cambiar label de zip a "Cód. Postal"
            divZip.find('label').text('Cód. Postal');
            
            console.log('[WEB_CHECKOUT_CONTACT] Colombian fields configured');
            
        } else {
            console.log('[WEB_CHECKOUT_CONTACT] Other country selected - showing standard fields');
            
            // Mantener div_state visible con campos estándar
            divState.show();
            divState.css('display', 'block');
            
            // Restaurar label a "Estado / Provincia"
            labelState.text('Estado / Provincia');
            
            // Mostrar state_id estándar, ocultar _state_id Colombia
            selectStateId.show();
            selectStateId.css('display', 'block');
            selectStateIdColombia.hide();
            selectStateIdColombia.css('display', 'none');
            
            // En divCity: mostrar city input, ocultar municipality_id
            divCity.show();
            divCity.css('display', 'block');
            inputCity.show();
            inputCity.css('display', 'block');
            selectMunicipality.hide();
            selectMunicipality.css('display', 'none');
            
            // Restaurar label de city a "Ciudad"
            const labelCity = divCity.find('label');
            labelCity.text('Ciudad');
            
            // Mostrar zip y HABILITAR para otros países
            divZip.show();
            divZip.css('display', 'block');
            zipInput.prop('disabled', false);
            zipInput.prop('readonly', false);
            
            // Restaurar label de zip
            const labelZip = divZip.find('label');
            labelZip.text('Código Postal');
            
            console.log('[WEB_CHECKOUT_CONTACT] Standard fields configured - zip enabled');
        }
    },

    /**
     * Handle visibility and layout based on identification type (NIT vs others)
     * @private
     */
    _handleIdentificationTypeVisibility: function () {
        const idTypeSelect = this.$("select[name='l10n_latam_identification_type_id_maskared']");
        const selectedText = idTypeSelect.find('option:selected').text();
        const isNIT = selectedText === 'NIT';
        
        console.log('[WEB_CHECKOUT_CONTACT] Identification type:', selectedText, '- Is NIT:', isNIT);
        
        const vatInput = this.$("input[name='vat']");
        const verificationCodeInput = this.$("input[name='verification_code']");
        const companyNameDiv = this.$('#company_name_div');
        const companyNameLabel = companyNameDiv.find('label');
        
        if (isNIT) {
            // NIT: Mostrar código verificación en la misma línea y Company Name
            console.log('[WEB_CHECKOUT_CONTACT] NIT selected - showing verification code and company name');
            
            // Cambiar etiqueta a "Empresa"
            companyNameLabel.text('Empresa');
            
            // Mostrar Company Name
            companyNameDiv.show();
            companyNameDiv.css('display', 'block');
            
            // Layout inline: número ID (60%) + código verificación (38%) con float
            vatInput.css({
                'width': '60%',
                'display': 'inline-block',
                'float': 'left',
                'margin-right': '2%'
            });
            
            // Mostrar código de verificación en la misma línea con float
            verificationCodeInput.css({
                'width': '38%',
                'display': 'inline-block',
                'float': 'left'
            });
            verificationCodeInput.show();
            
            // Deshabilitar código de verificación (se calcula automáticamente)
            verificationCodeInput.prop('disabled', true);
            
            console.log('[WEB_CHECKOUT_CONTACT] Layout: VAT 60% + VerificationCode 38% (inline with float)');
            
        } else {
            // NO NIT: Ocultar código verificación y Company Name completamente
            console.log('[WEB_CHECKOUT_CONTACT] Non-NIT selected - hiding verification code and company name');
            
            // Ocultar Company Name
            companyNameDiv.hide();
            companyNameDiv.css('display', 'none');
            
            // Ocultar código de verificación COMPLETAMENTE
            verificationCodeInput.hide();
            verificationCodeInput.css({
                'display': 'none',
                'width': '0',
                'float': 'none'
            });
            
            // Número ID ocupa todo el ancho, sin float
            vatInput.css({
                'width': '100%',
                'display': 'block',
                'float': 'none',
                'margin-right': '0'
            });
            
            // Habilitar código de verificación (por si acaso)
            verificationCodeInput.prop('disabled', false);
            
            console.log('[WEB_CHECKOUT_CONTACT] Layout: VAT 100% (full width, no float)');
        }
    },

    /**
     * Handle cascading visibility for Colombia fields
     * Shows department → shows municipality → shows zip code
     * @private
     */
    _handleColombiaCascade: function () {
        const countrySelect = this.$("select[name='country_id']");
        const countryCode = countrySelect.find('option:selected').attr('code');
        const isColombia = countryCode === 'CO';
        
        console.log('[WEB_CHECKOUT_CONTACT] Handling Colombia cascade - Is CO:', isColombia);
        
        if (!isColombia) {
            console.log('[WEB_CHECKOUT_CONTACT] Not Colombia - skipping cascade');
            return;
        }
        
        const departmentSelect = this.$("select[name='_state_id']");
        const municipalitySelect = this.$("select[name='municipality_id']");
        const divState = this.$('#div_state');  // Contenedor único
        const divCity = this.$('#div_city');
        const divZip = this.$('#div_zip');
        const zipInput = this.$("input[name='zip']");
        
        const departmentValue = departmentSelect.val();
        const municipalityValue = municipalitySelect.val();
        
        console.log('[WEB_CHECKOUT_CONTACT] Cascade values - Dept:', departmentValue, 'Muni:', municipalityValue);
        
        // SIEMPRE mostrar el div_state (contiene _state_id para Colombia)
        divState.show();
        divState.css('display', 'block');
        console.log('[WEB_CHECKOUT_CONTACT] Department field always visible for Colombia');
        
        // Lógica de cascada para municipio
        if (departmentValue && departmentValue !== "" && departmentValue !== "false") {
            console.log('[WEB_CHECKOUT_CONTACT] Department selected - showing municipality field');
            divCity.show();
            
            // Lógica de cascada para código postal
            if (municipalityValue && municipalityValue !== "" && municipalityValue !== "false") {
                console.log('[WEB_CHECKOUT_CONTACT] Municipality selected - showing zip code');
                divZip.show();
                // Deshabilitar zip para Colombia (se calcula automáticamente)
                zipInput.prop('disabled', true);
            } else {
                console.log('[WEB_CHECKOUT_CONTACT] No municipality selected - hiding zip');
                divZip.hide();
            }
        } else {
            console.log('[WEB_CHECKOUT_CONTACT] No department selected - hiding municipality and zip');
            divCity.hide();
            divZip.hide();
        }
    },

    /**
     * Fill departments dropdown for Colombia
     * @private
     */
    _fillDepartments: function () {
        const self = this;
        console.log('[WEB_CHECKOUT_CONTACT] Filling departments');
        
        $.ajax({
            type: "POST",
            url: '/location/get_departments',
            data: JSON.stringify({"params": {}}),
            dataType: 'json',
            contentType: "application/json",
            success: function(response) {
                try {
                    const departments = response.result;
                    let options = '<option value="">Seleccionar Departamento</option>';
                    
                    departments.forEach(function(department) {
                        options += `<option value="${department.id}">${department.name}</option>`;
                    });
                    
                    self.$("select[name='_state_id']").html(options);
                    console.log('[WEB_CHECKOUT_CONTACT] Departments loaded:', departments.length);
                } catch(error) {
                    console.log('[WEB_CHECKOUT_CONTACT] Error loading departments:', error);
                }
            }
        });
    },

    /**
     * Fill districts (municipalities) based on selected department
     * @private
     */
    _fillDistricts: function () {
        const self = this;
        const departmentId = this.$("select[name='_state_id']").val();
        
        if (!departmentId || departmentId === "") {
            console.log('[WEB_CHECKOUT_CONTACT] No department selected - skipping districts load');
            return;
        }
        
        console.log('[WEB_CHECKOUT_CONTACT] Filling districts for department:', departmentId);

        $.ajax({
            type: "POST",
            url: '/location/get_districts',
            data: JSON.stringify({"params": {'department_id': departmentId}}),
            dataType: 'json',
            contentType: "application/json",
            success: function(response) {
                try {
                    const districts = response.result;
                    let options = '<option value="">Municipio</option>';

                    districts.forEach(function(district) {
                        options += `<option value="${district.id}" code="${district.code}">${district.name}</option>`;
                    });
                    
                    self.$("select[name='municipality_id']").html(options);
                    console.log('[WEB_CHECKOUT_CONTACT] Districts loaded:', districts.length);
                } catch(error) {
                    console.log('[WEB_CHECKOUT_CONTACT] Error loading districts:', error);
                }
            }
        });            
    },

    /**
     * Assign zip code from selected municipality code attribute
     * @private
     */
    _assignZipCode: function () {
        const code = this.$("select[name='municipality_id'] option:selected").attr('code');
        if (code) {
            this.$("input[name='zip']").val(code);
            console.log('[WEB_CHECKOUT_CONTACT] Zip code assigned:', code);
        }
    },

    /**
     * Assign city name from selected municipality text
     * @private
     */
    _assignCityName: function () {
        const city = this.$("select[name='municipality_id'] option:selected").text().trim();
        if (city && city !== "Municipio") {
            this.$("input[name='city']").val(city);
            console.log('[WEB_CHECKOUT_CONTACT] City name assigned:', city);
        }
    },

    /**
     * Assign document type ID based on selected masked type
     * @private
     */
    _assignDocumentTypeId: function () {
        const self = this;
        const code = this.$("select[name='l10n_latam_identification_type_id_maskared']").val();
        
        if (!code || code === "") {
            return;
        }
        
        $.ajax({
            type: "POST",
            url: '/identification/document_type_id',
            data: JSON.stringify({"params": {'code': code}}),
            dataType: 'json',
            contentType: "application/json",
            success: function(response) {
                try {
                    const documentType = response.result;
                    self.$("input[name='l10n_latam_identification_type_id']").val(documentType.id);
                    console.log('[WEB_CHECKOUT_CONTACT] Document type ID assigned:', documentType.id);
                } catch(error) {
                    console.log('[WEB_CHECKOUT_CONTACT] Error assigning document type ID:', error);
                }
            }
        });
    },

    /**
     * Calculate and assign verification code (for NIT)
     * Uses the same algorithm from reference.js
     * @private
     */
    _assignVerificationCode: function () {
        let documentNumber = this.$("input[name='vat']").val();
        const verificationCode = this._calculateVerificationCode(documentNumber);
        
        if (verificationCode !== "") {
            this.$("input[name='verification_code']").val(verificationCode);
            console.log('[WEB_CHECKOUT_CONTACT] Verification code calculated:', verificationCode);
        }
    },

    /**
     * Calculate verification code for Colombian NIT
     * @private
     */
    _calculateVerificationCode: function (documentNumber) {
        documentNumber = documentNumber.replace(/\s/g, "");
        documentNumber = documentNumber.replace(/,/g, "");
        documentNumber = documentNumber.replace(/\./g, "");
        documentNumber = documentNumber.replace(/-/g, "");

        if (isNaN(documentNumber) || documentNumber === "") {
            console.log('[WEB_CHECKOUT_CONTACT] Invalid NIT:', documentNumber);
            return "";
        }

        const vpri = [0, 3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
        const z = documentNumber.length;
        let x = 0;

        for (let i = 0; i < z; i++) {
            const y = parseInt(documentNumber.substr(i, 1));
            x += (y * vpri[z - i]);  
        }

        const remainder = x % 11;
        return (remainder > 1) ? 11 - remainder : remainder;
    },

    /**
     * Helper method to show an input field and its parent container
     * OVERRIDE: For Colombia, redirect state_id → _state_id and city → municipality_id
     * @private
     */
    _showInput: function (fieldName) {
        const countrySelect = this.$("select[name='country_id']");
        const countryCode = countrySelect.find('option:selected').attr('code');
        const isColombia = countryCode === 'CO';
        
        // Para Colombia, redirigir campos específicos
        if (isColombia) {
            if (fieldName === 'state_id') {
                console.log(`[WEB_CHECKOUT_CONTACT] Colombia: Redirecting state_id → _state_id`);
                // Mostrar div_state pero con _state_id en lugar de state_id
                const divState = this.$('#div_state');
                const colField = this.$(`[name="_state_id"]`);
                const stdField = this.$(`[name="state_id"]`);
                
                if (divState.length > 0) {
                    divState.show();
                    divState.css('display', 'block');
                }
                if (colField.length > 0) {
                    colField.show();
                    colField.css('display', 'block');
                }
                if (stdField.length > 0) {
                    stdField.hide();
                    stdField.css('display', 'none');
                }
                return;
            }
            
            if (fieldName === 'city') {
                console.log(`[WEB_CHECKOUT_CONTACT] Colombia: city field - checking cascade logic`);
                // Para city, aplicar lógica de cascada (solo mostrar si hay departamento)
                const departmentValue = this.$("select[name='_state_id']").val();
                if (departmentValue && departmentValue !== "" && departmentValue !== "false") {
                    const muniField = this.$(`[name="municipality_id"]`);
                    const cityParent = this.$('#div_city');
                    if (muniField.length > 0) {
                        muniField.show();
                        cityParent.show();
                    }
                    // Ocultar input city estándar
                    this.$(`[name="city"]`).hide();
                }
                return;
            }
        }
        
        // Para otros países o campos no especiales, comportamiento estándar
        const field = this.$(`[name="${fieldName}"]`);
        if (field.length > 0) {
            field.show();
            const parent = field.closest('.form-group, div[class*="col-"]');
            if (parent.length > 0) {
                parent.show();
            }
            console.log(`[WEB_CHECKOUT_CONTACT] Showed input: ${fieldName}`);
        }
    },

    /**
     * Helper method to hide an input field and its parent container
     * @private
     */
    _hideInput: function (fieldName) {
        const field = this.$(`[name="${fieldName}"]`);
        if (field.length > 0) {
            field.hide();
            const parent = field.closest('.form-group, div[class*="col-"]');
            if (parent.length > 0) {
                parent.hide();
            }
            console.log(`[WEB_CHECKOUT_CONTACT] Hidden input: ${fieldName}`);
        }
    },

    /**
     * Auto-select Colombia as default country
     * Supports both Spanish ("Colombia") and Chinese ("哥伦比亚") names
     * Based on reference.js line 44-45
     * @private
     */
    _autoSelectColombia: function () {
        console.log('[WEB_CHECKOUT_CONTACT] Auto-selecting Colombia...');
        
        const countrySelect = this.$('select[name="country_id"]');
        
        // Try to select "Colombia" (Spanish)
        const colombiaSpanish = countrySelect.find('option:contains("Colombia")').first();
        if (colombiaSpanish.length > 0) {
            colombiaSpanish.prop('selected', true);
            console.log('[WEB_CHECKOUT_CONTACT] Colombia (Spanish) selected');
            return;
        }
        
        // Try to select "哥伦比亚" (Chinese)
        const colombiaChinese = countrySelect.find('option:contains("哥伦比亚")').first();
        if (colombiaChinese.length > 0) {
            colombiaChinese.prop('selected', true);
            console.log('[WEB_CHECKOUT_CONTACT] 哥伦比亚 (Chinese) selected');
            return;
        }
        
        console.log('[WEB_CHECKOUT_CONTACT] Colombia not found in country list');
    },
});