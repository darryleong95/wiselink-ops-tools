import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Input } from '@mui/material';
import Excel from 'exceljs';
import { saveAs } from 'file-saver'

const Rescheduler = () => {
    console.log('updated!')
    const padding = "_____"

    const classes = useClasses(styles)

    const [store, setStore] = useState({})

    const onFileChange = (e) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            readRaw(e.target.result)
        };
        reader.readAsBinaryString(f)
    }

    const isEmptyOrUndefined = (value) => {
        return value === '' || value === undefined
    }

    const compare = (a, b) => {
        if (a.del_date < b.del_date) {
            return -1;
        }
        if (a.del_date > b.del_date) {
            return 1;
        }
        return 0;
    }

    const parseDate = (num) => {
        var utc_value = Math.floor(num- 25569) * 86400;
        var date_info = new Date(utc_value * 1000);
        return date_info;
    }

    const readRaw = (data) => {
        let renderedData = XLSX.read(data, { type: 'binary', cellDates: false, callNF: false, cellText: false });
        const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });
        for (let i = 2; i < dataParse.length; i++) {
            // process system data first
            let line = dataParse[i][0]
            let sys_po = isEmptyOrUndefined(dataParse[i][1]) ? "" : dataParse[i][1]
            let sys_cpn = isEmptyOrUndefined(dataParse[i][2]) ? "" : dataParse[i][2]
            let sys_po_cpn = sys_po + padding + sys_cpn

            let stock_code = isEmptyOrUndefined(dataParse[i][3]) ? "" : dataParse[i][3]
            let sys_del_qty = isEmptyOrUndefined(dataParse[i][4]) ? "" : dataParse[i][4]

            let sys_del_date = isEmptyOrUndefined(dataParse[i][5]) ? "" : dataParse[i][5]
            sys_del_date = parseDate(sys_del_date)

            let sys_stock = isEmptyOrUndefined(dataParse[i][6]) ? "" : dataParse[i][6]
            let sys_remarks = isEmptyOrUndefined(dataParse[i][7]) ? "" : dataParse[i][7]

            // ensure row is not empty
            if (sys_po_cpn !== padding) {
                if (!(sys_po_cpn in store)) {
                    // add to store
                    store[sys_po_cpn] = {
                        "system": [],
                        "customer": []
                    }
                    store[sys_po_cpn]["system"].push({
                        line: line,
                        stock_code: stock_code,
                        del_qty: sys_del_qty,
                        del_date: sys_del_date,
                        stock: sys_stock,
                        remarks: sys_remarks
                    })
                } else {
                    // just append to existing
                    store[sys_po_cpn]["system"].push({
                        line: line,
                        stock_code: stock_code,
                        del_qty: sys_del_qty,
                        del_date: sys_del_date,
                        stock: sys_stock,
                        remarks: sys_remarks
                    })
                }
            }

            let cus_cpn = isEmptyOrUndefined(dataParse[i][8]) ? "" : dataParse[i][8]
            let cus_po = isEmptyOrUndefined(dataParse[i][10]) ? "" : dataParse[i][10]
            let cus_po_cpn = cus_po + padding + cus_cpn

            let cus_po_line = isEmptyOrUndefined(dataParse[i][11]) ? "" : dataParse[i][11]
            let cus_qty = isEmptyOrUndefined(dataParse[i][12]) ? "" : dataParse[i][12]
            let cus_date = isEmptyOrUndefined(dataParse[i][13]) ? "" : dataParse[i][13]
            cus_date = parseDate(cus_date)

            let cus_action = isEmptyOrUndefined(dataParse[i][14]) ? "" : dataParse[i][14]

            // ensure row is not empty
            if (cus_po_cpn !== padding) {
                if (!(cus_po_cpn in store)) {
                    // add to store
                    store[cus_po_cpn] = {
                        "system": [],
                        "customer": []
                    }
                    store[cus_po_cpn]["customer"].push({
                        line: cus_po_line,
                        del_qty: cus_qty,
                        del_date: cus_date,
                        remarks: cus_action,
                    })
                } else {
                    // just append to existing
                    store[cus_po_cpn]["customer"].push({
                        line: cus_po_line,
                        del_qty: cus_qty,
                        del_date: cus_date,
                        remarks: cus_action,
                    })
                }
            }
        }
        console.log(store)
    }

    const compile = async () => {

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet("My Sheet");

        let borderStyle = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        // top header row
        const cell1 = worksheet.getCell('A1');
        cell1.value = 'SYSTEM SCHEDULE'
        // fill A3 with solid coral
        worksheet.getCell('A1').border = borderStyle 
        worksheet.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9E1F2' },
        }
        const cell2 = worksheet.getCell('I1')
        worksheet.getCell('I1').border = borderStyle 
        cell2.value = 'CUSTOMER RESCHEDULE'
        worksheet.getCell('I1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC000' },
        }

        worksheet.mergeCells('A1', 'H1');
        worksheet.mergeCells('I1', 'L1');
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };

        // main header
        worksheet.addRow(['Line', 'CPO Number', 'CPN', 'Stock Code', 'Del-Qty', 'Del-Date', 'Stock', 'Remarks', 'Report Line', 'Open PO Qty', 'Reschedule Date', 'Action Request'])
        let fillStyleLB = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D9E1F2' },
        }
        worksheet.getCell('A2').fill = fillStyleLB
        worksheet.getCell('B2').fill = fillStyleLB
        worksheet.getCell('C2').fill = fillStyleLB
        worksheet.getCell('D2').fill = fillStyleLB
        worksheet.getCell('E2').fill = fillStyleLB
        worksheet.getCell('F2').fill = fillStyleLB
        worksheet.getCell('G2').fill = fillStyleLB
        worksheet.getCell('H2').fill = fillStyleLB

        worksheet.getCell('A2').border = borderStyle
        worksheet.getCell('B2').border = borderStyle
        worksheet.getCell('C2').border = borderStyle
        worksheet.getCell('D2').border = borderStyle
        worksheet.getCell('E2').border = borderStyle
        worksheet.getCell('F2').border = borderStyle
        worksheet.getCell('G2').border = borderStyle
        worksheet.getCell('H2').border = borderStyle

        let fillStyleG = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D0CECE' },
        }
        worksheet.getCell('I2').fill = fillStyleG
        worksheet.getCell('J2').fill = fillStyleG
        worksheet.getCell('K2').fill = fillStyleG
        worksheet.getCell('L2').fill = fillStyleG

        worksheet.getCell('I2').border = borderStyle
        worksheet.getCell('J2').border = borderStyle
        worksheet.getCell('K2').border = borderStyle
        worksheet.getCell('L2').border = borderStyle

        // content
        for (const [key, value] of Object.entries(store)) {
            let [po, cpn] = key.split(padding)
            let system = value["system"]
            system.sort(() => compare);
            let customer = value["customer"]
            customer.sort(() => compare);
            let totalRows = Math.max(system.length, customer.length)
            for (let i = 0; i < totalRows; i++) {
                let d = Array(12).fill('-')
                d[1] = po
                d[2] = cpn
                if (typeof system[i] !== 'undefined') {
                    d[0] = system[i].line
                    d[3] = system[i].stock_code
                    d[4] = system[i].del_qty
                    d[5] = system[i].del_date
                    d[6] = system[i].stock
                    d[7] = system[i].remarks
                }
                if (typeof customer[i] !== 'undefined') {
                    d[8] = customer[i].line
                    d[9] = customer[i].del_qty
                    d[10] = customer[i].del_date
                    d[11] = customer[i].remarks
                }
                worksheet.addRow(d)
            }
        }

        const buf = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buf]), 'Rescheduled.xlsx')
    }

    return (
        <div className={classes.root}>
            <h1 className={classes.pageTitle}>Reschedule Report</h1>
            <p className={classes.pageLead}>Line up the system schedule with the customer reschedule request.</p>
            <div className={classes.fileUploadContainer}>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Rescheduler upload file</span>
                    <Input onChange={(event) => onFileChange(event)} type="file" className={classes.fileUpload} />
                </div>
            </div>
            <div className={classes.actionRow}>
                <button onClick={() => compile()} className={classes.download}>
                    Export
                </button>
            </div>
        </div>
    );
}

export default Rescheduler;