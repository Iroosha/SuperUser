sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel", 
    "sap/m/MessageToast"           
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("superusermanagement.controller.ObjectPage", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            // Attach a handler that fires every time the "RouteObjectPage" is hit
            oRouter.getRoute("RouteObjectPage").attachPatternMatched(this._onObjectMatched, this);

            // Create a local UI model to control edit/display toggle states
            var oUiModel = new JSONModel({
                isEditMode: false
            });
            this.getView().setModel(oUiModel, "ui");
        },
        
        _onObjectMatched: function (oEvent) {
            var sPath = oEvent.getParameter("arguments").emailPath;
            var oModel = this.getView().getModel();
            var oUiModel = this.getView().getModel("ui");

            if (sPath === "new") {
                //Force the page straight into Edit Mode
                oUiModel.setProperty("/isEditMode", true);

                this.getView().unbindElement();

                if (this._oCreateContext) {
                    oModel.deleteCreatedEntry(this._oCreateContext);
                    this._oCreateContext = null;
                }

                //Create a clean, blank entry in the OData model buffer
                var oContext = oModel.createEntry("/FCPUserSet", {
                    properties: {
                        Email: "",
                        FirstName: "",
                        LastName: "",
                        CustomerNo: "",
                        Phone: "",
                        IsActive: false
                    }
                });

                //Bind this new temporary entry context directly to the view
                this.getView().setBindingContext(oContext);

            } else {
                // Regular Display/Edit flow for existing entries
                oUiModel.setProperty("/isEditMode", false);
                this.getView().setBindingContext(null);
                this.getView().bindElement({
                    path: "/" + sPath
                });
            }
        },

        onEdit: function () {
            // Turn on edit mode inputs
            this.getView().getModel("ui").setProperty("/isEditMode", true);
            this.getOwnerComponent().getModel("appView").setProperty("/isCreateMode", false);
        },

        onCancel: function () {
            var oModel = this.getView().getModel();
            
            // Reject any pending local changes in the OData model buffer
            if (oModel.hasPendingChanges()) {
                oModel.resetChanges();
            }

            // Turn off edit mode inputs
            this.getView().getModel("ui").setProperty("/isEditMode", false);
        },

        onSave: function () {
            var oModel = this.getView().getModel();
            var oUiModel = this.getView().getModel("ui");
            var oContext = this.getView().getBindingContext();
            this.getView().setBusy(true);
            oModel.setProperty(oContext.getPath() + "/IsSuper", true);            
            oModel.setUseBatch(false);

            var oPayload = {
                Email:  this.getView().byId("Email").getValue(),
                CustomerNo:  this.getView().byId("CustomerNo").getValue(),
                Title:  this.getView().byId("Title").getValue(),
                FirstName:  this.getView().byId("FirstName").getValue(),
                LastName:  this.getView().byId("LastName").getValue(),
                IsActive:  this.getView().byId("IsActive").getSelected(),
                Phone:  this.getView().byId("Phone").getValue(),
                IsSuper:  true
            };

            var bIsCreate = this.getView().getModel("appView").getProperty("/isCreateMode"); 

            var mParameters = {
                success: function(oData, response) {
                    sap.m.MessageToast.show("Operation completed successfully!");
                },
                error: function(oError) {
                    sap.m.MessageBox.error("Operation failed.");
                }
            };

            if (bIsCreate) {
                this.getView().setBusy(false);
                oModel.create("/FCPUserSet", oPayload, mParameters);              
            } else {
                this.getView().setBusy(false);
                var sPath = oModel.createKey("/FCPUserSet", {
                    Email: oPayload.Email
                });
                
                // Execute PUT/MERGE call
                oModel.update(sPath, oPayload, mParameters);
            }

        },

        //Triggered when clicking the input field value help icon
        onCustomerValueHelpRequest: function (oEvent) {
            var oView = this.getView();

            // Load the fragment asynchronously to preserve performance
            if (!this._pCustomerValueHelpDialog) {
                this._pCustomerValueHelpDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "superusermanagement.view.CustomerValueHelpDialog", 
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pCustomerValueHelpDialog.then(function(oDialog) {
                // Open the dialog
                oDialog.open();
            });
        },

        //Triggered when typing into the search bar inside the pop-up
        onCustomerValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            // Replace "CustomerNo" with the search field property name in your OData entity set
            var oFilter = new sap.ui.model.Filter("CustomerNo", sap.ui.model.FilterOperator.Contains, sValue);
            
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);

        },

        // Triggered when choosing a customer from the selection list
        onCustomerValueHelpConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var oInput = this.getView().byId("CustomerNo");

            if (!oSelectedItem) {
                return;
            }

            // Get the technical title property value from the chosen standard list item
            var sSelectedCustomerNo = oSelectedItem.getTitle();
            
            // Set the value inside your bound field framework UI component
            oInput.setValue(sSelectedCustomerNo);

            // Explicitly sync the change back to the active underlying OData draft/context entry buffer
            var oContext = this.getView().getBindingContext();
            if (oContext) {
                var oModel = this.getView().getModel();
                oModel.setProperty(oContext.getPath() + "/CustomerNo", sSelectedCustomerNo);
            }
        }
    });
});