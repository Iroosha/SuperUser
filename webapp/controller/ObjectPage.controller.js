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


            // oModel.submitChanges({
            //     success: function (oData, response) {
            //         this.getView().setBusy(false);
            //         oUiModel.setProperty("/isEditMode", false);
            //         sap.m.MessageToast.show("User updated successfully!");
                    
            //         // Re-enable batching if you use it elsewhere in your app
            //        // oModel.setUseBatch(true);
            //     }.bind(this),
            //     error: function (oError) {
            //         this.getView().setBusy(false);
            //         sap.m.MessageToast.show("Error saving data.");
                    
            //         // Re-enable batching
            //         //oModel.setUseBatch(true);
            //     }.bind(this)
            // });
        }
    });
});