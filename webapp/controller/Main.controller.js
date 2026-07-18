sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",         // 1. Add Filter path
    "sap/ui/model/FilterOperator"  // 2. Add FilterOperator path
], function (Controller, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("superusermanagement.controller.Main", {
        onInit: function () {
            // Initial logic goes here
        },

        onRowPress: function (oEvent) {
            // The source of the press event is the ColumnListItem row itself
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext();
            
            if (!oCtx) {
                return;
            }
            
            var sPath = oCtx.getPath().substr(1);
            
            // Route to your Object Page
            this.getOwnerComponent().getRouter().navTo("RouteObjectPage", {
                emailPath: sPath
            });
        },

        onCreateUser: function () {
            this.getOwnerComponent().getModel("appView").setProperty("/isCreateMode", true);
            // Navigate to the ObjectPage with a "new" flag
            this.getOwnerComponent().getRouter().navTo("RouteObjectPage", {
                emailPath: "new"
            });
        },

        onFilterBarInitialise: function (oEvent) {
            var oSmartFilterBar = oEvent.getSource();
            
            // Construct the default filter state data structure
            var oDefaultFilterData = {
                // Adjust property names to match your OData service metadata definitions exactly
                "IsSuper": true
            };

            // Inject the data object directly into the SmartFilterBar framework state
            oSmartFilterBar.setFilterData(oDefaultFilterData);
        },

        onBeforeRebindTable: function (oEvent) {
            // 1. Get the table's internal binding parameters object
            var oBindingParams = oEvent.getParameter("bindingParams");
            
            // 2. Create your mandatory filter condition
            var oMandatoryFilter = new Filter("IsSuper", FilterOperator.EQ, true);
            
            // 3. Inject it straight into the binding parameters filters array
            if (!oBindingParams.filters) {
                oBindingParams.filters = [];
            }
            oBindingParams.filters.push(oMandatoryFilter);
        }
    });
});