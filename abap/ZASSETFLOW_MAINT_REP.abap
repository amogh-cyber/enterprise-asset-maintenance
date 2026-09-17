*&---------------------------------------------------------------------*
*& Report ZASSETFLOW_MAINT_REP
*& Title: AssetFlow Enterprise Maintenance & Work Order Execution Report
*& Target Role: Associate Systems Engineer / SAP S/4HANA ABAP Developer
*& Description: Demonstrates Open SQL, ABAP Data Dictionary structures,
*&              Internal tables, Selection Screens, and Authority checks.
*&---------------------------------------------------------------------*
REPORT zassetflow_maint_rep NO STANDARD PAGE HEADING
                           LINE-SIZE 132
                           LINE-COUNT 65.

*----------------------------------------------------------------------*
* 1. Data Dictionary Types & Internal Structures
*----------------------------------------------------------------------*
TYPES: BEGIN OF ty_work_order,
         aufnr TYPE c LENGTH 12,           " Work Order ID (AssetFlow WO-*)
         qmnum TYPE c LENGTH 12,           " Notification ID (AssetFlow MR-*)
         equnr TYPE c LENGTH 18,           " Equipment ID (AssetFlow AST-*)
         eqktx TYPE c LENGTH 40,           " Equipment Description
         ernam TYPE c LENGTH 12,           " Created By User
         pernr TYPE n LENGTH 8,            " Assigned Technician Personnel #
         iphas TYPE c LENGTH 2,            " Phase (0=Created, 2=In Progress, 3=Completed)
         cost  TYPE p LENGTH 8 DECIMALS 2, " Actual Accumulated Maintenance Cost
         erdat TYPE d,                     " Creation Date
       END OF ty_work_order.

DATA: gt_orders TYPE STANDARD TABLE OF ty_work_order,
      gs_order  TYPE ty_work_order.

*----------------------------------------------------------------------*
* 2. Selection Screen (Parameters & Select-Options)
*----------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE text-001.
  SELECT-OPTIONS: s_equnr FOR gs_order-equnr,
                  s_pernr FOR gs_order-pernr,
                  s_erdat FOR gs_order-erdat.
  PARAMETERS:     p_phase TYPE c LENGTH 2 DEFAULT '2' OBLIGATORY.
SELECTION-SCREEN END OF BLOCK b1.

*----------------------------------------------------------------------*
* 3. Initialization & Authorization Check
*----------------------------------------------------------------------*
INITIALIZATION.
  " Default date range: last 30 days
  s_erdat-sign   = 'I'.
  s_erdat-option = 'BT'.
  s_erdat-low    = sy-datum - 30.
  s_erdat-high   = sy-datum.
  APPEND s_erdat.

AT SELECTION-SCREEN.
  " Check user authorization for Plant Maintenance Work Order display (IW33)
  AUTHORITY-CHECK OBJECT 'I_TCODE'
    ID 'TCD' FIELD 'IW33'.
  IF sy-subrc <> 0.
    MESSAGE 'User not authorized for Plant Maintenance Order display.' TYPE 'E'.
  ENDIF.

*----------------------------------------------------------------------*
* 4. Data Selection & Open SQL Query
*----------------------------------------------------------------------*
START-OF-SELECTION.
  PERFORM fetch_maintenance_orders.
  PERFORM display_alv_report.

*&---------------------------------------------------------------------*
*& Form fetch_maintenance_orders
*&---------------------------------------------------------------------*
FORM fetch_maintenance_orders.
  " Simulating query against SAP PM tables AUFK (Order Master) & AFIH (Maintenance Order)
  " In an S/4HANA environment, this queries CDS views (e.g., I_MaintenanceOrder)
  " SELECT a~aufnr, b~qmnum, b~equnr, c~eqktx, a~ernam, b~pernr, a~iphas, a~erdat
  "   FROM aufk AS a
  "   INNER JOIN afih AS b ON a~aufnr = b~aufnr
  "   LEFT OUTER JOIN equi AS c ON b~equnr = c~equnr
  "   INTO CORRESPONDING FIELDS OF TABLE @gt_orders
  "   WHERE b~equnr IN @s_equnr
  "     AND a~erdat IN @s_erdat.
ENDFORM.

*&---------------------------------------------------------------------*
*& Form display_alv_report
*&---------------------------------------------------------------------*
FORM display_alv_report.
  WRITE: / 'AssetFlow Enterprise Maintenance Execution Report' COLOR COL_HEADING.
  WRITE: / sy-datum, sy-uzeit, sy-uname.
  ULINE.

  IF gt_orders IS INITIAL.
    WRITE: / 'No maintenance work orders found matching selection criteria.' COLOR COL_TOTAL.
  ENDIF.
ENDFORM.
