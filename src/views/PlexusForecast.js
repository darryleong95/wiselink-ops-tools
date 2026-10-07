import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Box, Input } from '@mui/material';

const PlexusForecast = () => {

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
        for (let i = 1; i < dataParse.length; i++) {
            let partNumber = dataParse[i][4]
            let facilityNumber = dataParse[i][2]
            let combined = facilityNumber + partNumber
            if (!(combined in parts)) {
                parts[combined] = {
                    facilityNumber,
                    partNumber
                }
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
        if (inOld.length === 0) {
            wbData.push({ 'SITE': 'N/A' })
            wbData.push({ 'NOT IN FORECAST': 'N/A' })
        }
        for (let i = 0; i < inOld.length; i++) {
            let part = inOld[i]
            let rowInfo = {}
            rowInfo['SITE'] = oldForecast[part]['facilityNumber']
            rowInfo['NOT IN FORECAST'] = oldForecast[part]['partNumber']
            wbData.push(rowInfo)
        }
        wbData.push({})
        // fill new business
        wbData.push({ 'SITE': '' })
        wbData.push({ 'NOT IN FORECAST': 'NEWLY AWARDED PARTS' })
        if (inNew.length === 0) {
            wbData.push({ 'SITE': 'N/A' })
            wbData.push({ 'NOT IN FORECAST': 'N/A' })
        }
        for (let i = 0; i < inNew.length; i++) {
            let part = inNew[i]
            let rowInfo = {}
            rowInfo['SITE'] = newForecast[part]['facilityNumber']
            rowInfo['NOT IN FORECAST'] = newForecast[part]['partNumber']
            wbData.push(rowInfo)
        }
        wbData.push({})
        // fill overlap
        wbData.push({ 'SITE': '' })
        wbData.push({ 'NOT IN FORECAST': 'EXISTING BUSINESS' })
        if (intersection.length === 0) {
            wbData.push({ 'SITE': 'N/A' })
            wbData.push({ 'NOT IN FORECAST': 'N/A' })
        }
        for (let i = 0; i < intersection.length; i++) {
            let part = intersection[i]
            let rowInfo = {}
            rowInfo['SITE'] = oldForecast[part]['facilityNumber']
            rowInfo['NOT IN FORECAST'] = oldForecast[part]['partNumber']
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
        FileSaver.saveAs(dd, 'Plexus_Forecast_Comparison.xlsx');
    }

    return (
        <Box className={classes.root}>
            <h1 className={classes.pageTitle}>Plexus Forecast Comparison</h1>
            <p className={classes.pageLead}>Compare an older forecast with a new one by facility and part.</p>
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
        </Box>
    );
}

export default PlexusForecast;