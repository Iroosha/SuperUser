sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel", 
    "sap/m/MessageToast",
    "sap/m/MessageBox",       
], function (Controller, JSONModel, MessageToast, MessageBox) {
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

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteMain", {}, true);
        },

        onSave: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oUiModel = oView.getModel("ui");
            var oContext = oView.getBindingContext();
            
            oModel.setProperty(oContext.getPath() + "/IsSuper", true);            
            oModel.setUseBatch(false);

            var sEmail = oView.byId("Email").getValue().trim();
            var sCustomerNo = oView.byId("CustomerNo").getValue().trim();
            var sFirstName = oView.byId("FirstName").getValue().trim();
            var sLastName = oView.byId("LastName").getValue().trim();

            if (!sEmail) {
                MessageBox.error(
                    "Email is required."
                );
                return;
            }

            if (!sCustomerNo) {
                MessageBox.error(
                    "Customer Number is required."
                );
                return;
            }

            if (!sFirstName) {
                MessageBox.error(
                    "First Name is required."
                );
                return;
            }

            if (!sLastName) {
                MessageBox.error(
                    "Last Name is required."
                );
                return;
            }

            var oPayload = {
                Email:  oView.byId("Email").getValue(),
                CustomerNo:  oView.byId("CustomerNo").getValue(),
                Title:  oView.byId("Title").getValue(),
                FirstName:  oView.byId("FirstName").getValue(),
                LastName:  oView.byId("LastName").getValue(),
                IsActive:  oView.byId("IsActive").getSelected(),
                Phone:  oView.byId("Phone").getValue(),
                IsSuper:  true
            };

            var bIsCreate = oView.getModel("appView").getProperty("/isCreateMode"); 

            var router =  this.getOwnerComponent().getRouter();

            var mParameters = {
                success: function(oData, response) {
                    oView.setBusy(false);
                     var sSapUserName =
                            oData && oData.SapUserName
                                ? oData.SapUserName
                                : "";

                    var sMessage = sSapUserName
                            ? "The user was edited successfully.\n\n" +
                            "Generated SAP user name: " +
                            sSapUserName
                            : "The user was created successfully.";

                    //sap.m.MessageToast.show(sMessage);

                    MessageBox.success(sMessage, {
                            title: "User Created",
                            actions: [
                                MessageBox.Action.OK
                            ],
                            emphasizedAction:
                                MessageBox.Action.OK,

                            onClose: function () {
                                oView.getModel("appView").setProperty("/isCreateMode", false);
                                
                                if (this._oCreateContext) {
                                    oModel.deleteCreatedEntry(
                                        this._oCreateContext
                                    );

                                    this._oCreateContext = null;
                                }

                                router.navTo("RouteMain",{},true);
                            }.bind(this)
                        });
                },
                error: function(oError) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("An error occurred while saving.");
                }
            };

            oView.setBusy(true);

            if (bIsCreate) {
                oView.setBusy(false);
                oModel.create("/FCPUserSet", oPayload, mParameters);              
            } else {
                oView.setBusy(false);
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