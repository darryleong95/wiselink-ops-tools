import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Input, TextField } from '@mui/material';
import emailjs from 'emailjs-com';

const PlexusEmail = () => {

    const classes = useClasses(styles)
    const [info, setInfo] = useState({})
    const [ccEmail, setCCEmail] = useState("")
    const SERVICE_NUM = 'service_l8bn2oe'
    const USER_ID = 'user_SsmjEgiokboVh84Izujp1'
    const TEMPLATE_ID = 'template_zy4e9yq'

    const onFileChange = (e) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        if (files[0] === undefined){
            return
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            readRaw(e.target.result)
        };
        reader.readAsBinaryString(f)
    }

    const capitalizeString = (words) => {
        var separateWord = words.toLowerCase().split(' ');
        for (var i = 0; i < separateWord.length; i++) {
            separateWord[i] = separateWord[i].charAt(0).toUpperCase() + separateWord[i].substring(1)
        }
        return separateWord.join(' ')
    }

    const isEmptyOrNull = (input) => {
        return input === undefined || input === ''
    }

    const isArrayInputEmptyOrNull = (arr) => {
        for (let input in arr) {
            if (isEmptyOrNull(input)) {
                return true
            }
        }
        return false
    }

    const readRaw = (data) => {
        let renderedData = XLSX.read(data, { type: 'binary' });
        const dataParse = XLSX.utils.sheet_to_json(renderedData.Sheets[renderedData.SheetNames[0]], { header: 1 });
        let dict = {}
        let flag = false
        for (let i = 1; i < dataParse.length; i++) {
            if (dataParse[i].length <= 0) {
                flag = true
                break
            }
            let cpn = dataParse[i][0].toString()
            let stockCode = dataParse[i][1].toString()
            let brand = dataParse[i][3].toString()
            let name = dataParse[i][4].toString()
            let email = dataParse[i][5].toString()

            if (isArrayInputEmptyOrNull([cpn, stockCode, brand, email, name])) {
                flag = true
                break
            }

            if (!(email in dict))
                dict[email] = []

            dict[email].push({
                cpn: cpn.trim(),
                stockCode: stockCode.trim(),
                brand: brand.trim(),
                name: capitalizeString(name.trim())
            })
        }
        if (flag) {
            alert('Ensure input file is in correct format')
            console.log('Input file validation failed')
        } else {
            console.log(`Total Emails: ${Object.keys(dict).length}`)
            setInfo(dict)
        }
    }

    const sendEmail = async () => {
        if (Object.keys(info).length === 0) {
            alert('Ensure Valid file is uploaded')
            return
        }
        for (const [key, v] of Object.entries(info)) {
            if (key === undefined) {
                break
            }
            console.log(key)
            let name = v[0].name
            let body = `<table style="line-height:20px;width:100%;text-align:left"><tr><th>CPN</th><th>MFR</th><th>MPN</th></tr>`
            let cpnList = ''
            for (let i = 0; i < v.length; i++) {
                body += `<tr><td><strong>${v[i].cpn}</strong></td><td><strong>${v[i].brand}</strong></td><td><strong>${v[i].stockCode}</strong></td></tr>`
                cpnList += `${v[i].cpn}`
                if (i !== v.length - 1) {
                    cpnList += ', '
                }
            }
            body += '</table>'
            var templateParams = {
                to_email: 'darryleong95@gmail.com',
                // to_email: v.email,
                cpn_list: cpnList,
                to_name: name,
                table: body
            };

            console.log(templateParams)
            await emailjs.send(SERVICE_NUM, TEMPLATE_ID, templateParams, USER_ID)
                .then(function (response) {
                    console.log('SUCCESS!', response.status, response.text);
                }, function (error) {
                    console.log('FAILED...', error);
                });
            break
        }
        alert('Emails sent.')
    }


    const handleCC = (e) => {
        setCCEmail(e.target.value)
    }

    return (
        <div className={classes.root}>
            <h1 className={classes.pageTitle}>Plexus Email</h1>
            <p className={classes.pageLead}>Upload buyer booking details and send the grouped emails.</p>
            <div className={classes.fileUploadContainer}>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Buyer Booking Details</span>
                    <div className={classes.inputContainer}>
                        <Input onChange={(event) => onFileChange(event, 1)} type="file" className={classes.fileUpload} variant={'filled'} />
                        <TextField className={classes.sideField} label="CC email" value={ccEmail} onChange={handleCC} rows={1} rowsMax={1} />
                    </div>
                </div>
            </div>
            <div className={classes.actionRow}>
                <button onClick={() => sendEmail()} className={classes.download}>
                    Send
                </button>
            </div>
        </div>
    );
}


export default PlexusEmail;