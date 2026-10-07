import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Input } from '@mui/material';

const JabilForecast = () => {

    const classes = useClasses(styles)

    const [oldForecast, setOldForecast] = useState({})
    const [newForecast, setNewForecast] = useState({})

    const onFileChange = (e, fileNo) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            readRaw(e.target.result, fileNo)
        };
        reader.readAsBinaryString(f)
    }

    const readRaw = (data, num) => {
        let renderedData = XLSX.read(data, { type: 'binary' });
        const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });
        let parts = {}
        for (let i = 3; i < dataParse.length; i++) {
            let buyerPartCode = dataParse[i][2]
            let mpn = dataParse[i][3]
            let c = buyerPartCode + ',' + mpn
            if (!(c in parts)) {
                parts[c] = true
            }
        }
        num === 1 ? setOldForecast(parts) : setNewForecast(parts)
    }

    const calculateDifference = () => {
        let a = Object.keys(oldForecast)
        let b = Object.keys(newForecast)
        let intersection = a.filter(x => b.includes(x))
        let inA = a.filter(x => !b.includes(x))
        let inB = b.filter(x => !a.includes(x))
        downloadFile(intersection, inA, inB)
    }

    const downloadFile = (intersection, inOld, inNew) => {
        let wbData = []
        // fill old business
        if (inOld.length === 0){
            wbData.push({'NOT IN FORECAST': 'N/A'})
        }
        for (let i = 0; i < inOld.length; i++) {
            let cArr = inOld[i].split(',')
            let buyerPartCode = cArr[0]
            let mpn = cArr[1]
            let rowInfo = {}
            rowInfo['NOT IN FORECAST'] = buyerPartCode
            rowInfo[''] = mpn
            wbData.push(rowInfo)
        }
        wbData.push({})
        // fill new business
        wbData.push({'NOT IN FORECAST': 'NEWLY AWARDED PARTS'})
        if (inNew.length === 0){
            wbData.push({'NOT IN FORECAST': 'N/A'})
        }
        for (let i = 0; i < inNew.length; i++) {
            let cArr = inNew[i].split(',')
            let buyerPartCode = cArr[0]
            let mpn = cArr[1]
            let rowInfo = {}
            rowInfo['NOT IN FORECAST'] = buyerPartCode
            rowInfo[''] = mpn
            wbData.push(rowInfo)
        }
        wbData.push({})
        // fill overlap
        wbData.push({'NOT IN FORECAST': 'EXISTING BUSINESS'})
        if (intersection.length === 0){
            wbData.push({'NOT IN FORECAST': 'N/A'})
        }
        for (let i = 0; i < intersection.length; i++) {
            let cArr = intersection[i].split(',')
            let buyerPartCode = cArr[0]
            let mpn = cArr[1]
            let rowInfo = {}
            rowInfo['NOT IN FORECAST'] = buyerPartCode
            rowInfo[''] = mpn
            wbData.push(rowInfo)
        }
        let ws = XLSX.utils.json_to_sheet(wbData)
        ws['!ref'] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: wbData.length + 1, c: 1 }
        })
        let wb = { Sheets: { 'data': ws }, SheetNames: ['data'] }
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dd = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(dd, 'Jabil_Forecast_Comparison.xlsx');
    }


    return (
        <div className={classes.root}>
            <h1 className={classes.pageTitle}>Jabil Forecast Comparison</h1>
            <p className={classes.pageLead}>Compare two Jabil forecasts by buyer part and MPN.</p>
            <div className={classes.fileUploadContainer}>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Old file</span>
                    <Input onChange={(event) => onFileChange(event, 1)} type="file" className={classes.fileUpload} />
                </div>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>New file</span>
                    <Input onChange={(event) => onFileChange(event, 2)} type="file" className={classes.fileUpload} />
                </div>
            </div>
            <div className={classes.actionRow}>
                <button onClick={() => calculateDifference()} className={classes.download}>
                    Export
                </button>
            </div>
        </div>
    );
}

export default JabilForecast;