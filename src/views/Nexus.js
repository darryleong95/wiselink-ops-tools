import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import * as FileSaver from 'file-saver'
import { styles } from '../styles'
import useClasses from '../useClasses'
import { excelDateToJSDate } from '../utils'
import { Box, Input } from '@mui/material'


const Nexus = () => {

    const classes = useClasses(styles)

    const [rowInfo, setRowInfo] = useState([])

    const [headers, setHeaders] = useState([])

    const [mpn, setMpns] = useState({})

    const readMpns = (data) => {
        let renderedData = XLSX.read(data, { type: 'binary' });
        const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });
        for (let i = 1; i < dataParse.length; i++) {
            mpn[dataParse[i][0]] = {
                mpn: dataParse[i][1],
                moq: dataParse[i][2],
                lt: dataParse[i][3],
                manufacturer: dataParse[i][4] || ''
            }
        }
    }

    const readRaw = (data) => {
        let renderedData = XLSX.read(data, { type: 'binary' });
        const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });

        let headers = dataParse[0]
        headers.push("Committed Qty")
        headers.push("Commit ETA")
        headers.push("Balance Qty")
        headers.push("Balance Qty with Commit Qty ")
        headers.push("MOQ")
        headers.push("LT")
        headers.push("Late Commit ETA")
        headers.push("Week Counter")
        setHeaders(headers)

        for (let i = 1; i < dataParse.length; i++) {
            // Filter JIT
            if (dataParse[i][5] == "JIT" || dataParse[i][5] == "ARPN") {
                dataParse[i][3] = parseDate(dataParse[i][3])
                dataParse[i][12] = parseDate(dataParse[i][12])
                dataParse[i][15] = parseDate(dataParse[i][15])
                rowInfo.push(dataParse[i])
            }
        }
        // console.log(rowInfo)
    }

    const parseDate = (input) => {
        if(input === undefined){
            return null
        }
        if (typeof input === 'number') {
            return excelDateToJSDate(input)
        }
        let da = input.split('/')
        return new Date(da[2], da[0] - 1, da[1])
    }

    const onFileChange = (e, fileNo) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            if (fileNo === 1)
                readRaw(e.target.result)
            else if (fileNo === 2)
                readMpns(e.target.result)

            // else
        };
        reader.readAsBinaryString(f)
    }

    const downloadFile = () => {
        let wbData = []
        let i = 0
        while (i < rowInfo.length) {
            let MPN = rowInfo[i][4]
            while (i < rowInfo.length && MPN == rowInfo[i][4]) {
                let rowData = {}
                rowInfo[i].forEach((val, idx) => {
                    rowData[headers[idx]] = val
                })
                if (rowData['PlexusPartNumber'] in mpn) {
                    rowData['MOQ'] = mpn[rowData['PlexusPartNumber']].moq
                    rowData['LT'] = mpn[rowData['PlexusPartNumber']].lt
                    rowData['Manufacturer'] = mpn[rowData['PlexusPartNumber']].manufacturer
                }
                wbData.push(rowData)
                i++
            }
            // add 2 blank rows
            wbData.push({})
            wbData.push({})
        }

        wbData.forEach((row, i) => {
            if (Object.keys(wbData[i]).length == 0) {
                // has a data row above - indicates that this is the first row after a block of data
                if (Object.keys(wbData[i - 1]).length > 1) {
                    if (wbData[i - 1]['PlexusPartNumber'] in mpn) {
                        row['PlexusPartNumber'] = mpn[wbData[i - 1]['PlexusPartNumber']].mpn
                    }
                }
            }
        })

        let ws = XLSX.utils.json_to_sheet(wbData, { header: headers })

        ws['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: wbData.length + 1, c: 25 }
        })

        wbData.forEach((row, i) => {
            //console.log(row)
            let er = i + 2
            let balanceQty = ''
            let balanceQtyCommit = ''
            let commitEta = ''
            let weekCounter = ''
            let moq = ''
            let lt = ''
            let manufacturer = ''
            if (Object.keys(wbData[i]).length > 1) {
                if (i == 0 || (Object.keys(wbData[i - 1]).length <= 1 && Object.keys(wbData[i - 2]).length <= 1)) {
                    balanceQty = `H${er}+I${er}+O${er}-N${er}`
                    balanceQtyCommit = `H${er}+I${er}+O${er}+R${er}-N${er}`
                } else {
                    balanceQty = `T${er - 1}-N${er}+O${er}`
                    balanceQtyCommit = `U${er - 1}-N${er}+O${er}+R${er}`
                }
                commitEta = `=IF(S${er}>P${er},1,"")`
                weekCounter = `=INT((TODAY()-P${er})/7)`
                moq = row['MOQ']
                lt = row['LT']
                manufacturer = row['Manufacturer']
                // let marker = `IF(U${er-1}>=0, IF(U${er}<=0, "<-- Highlight row",""),"")`

                let balanceQtyCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 19 })
                let balanceQtyCommitCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 20 })
                let moqCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 21 })
                let ltCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 22 })
                let commitEtaCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 23 })
                let weekCounterCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 24 })
                let manufacturerCellRef = XLSX.utils.encode_cell({ r: er - 1, c: 25 })

                ws[balanceQtyCellRef] = { f: balanceQty }
                ws[balanceQtyCommitCellRef] = { f: balanceQtyCommit }
                ws[commitEtaCellRef] = { f: commitEta }
                ws[weekCounterCellRef] = { f: weekCounter }
                ws[moqCellRef] = { v: moq }
                ws[ltCellRef] = { v: lt }
                ws[manufacturerCellRef] = { v: manufacturer }
            }
        })

        let wb = { Sheets: { 'data': ws }, SheetNames: ['data'] }
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dd = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(dd, 'Data.xlsx');
    }


    return (
        <Box className={classes.root}>
            <h1 className={classes.pageTitle}>Plexus JIT Program</h1>
            <p className={classes.pageLead}>Filter JIT lines, join the MPN list, and download a working file.</p>
            <div className={classes.fileUploadContainer}>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Plexus forecast file</span>
                    <Input onChange={(event) => onFileChange(event, 1)} type="file" className={classes.fileUpload} />
                </div>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>MPN List</span>
                    <Input onChange={(event) => onFileChange(event, 2)} type="file" className={classes.fileUpload} />
                </div>
            </div>
            <div className={classes.actionRow}>
                <button onClick={() => downloadFile()} className={classes.download}>
                    Download
                </button>
            </div>
        </Box>
    );
}

export default Nexus;