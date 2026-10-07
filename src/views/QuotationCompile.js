import React, { useState } from 'react';
import { styles } from '../styles';
import useClasses from '../useClasses';
import { Backdrop, CircularProgress, Input } from '@mui/material';
import axios from 'axios';

const QuotationCompile = () => {
    const classes = useClasses(styles)
    const [loading, setLoading] = useState(false)
    const [inputFile, setInputFile] = useState(null)
    const [priceList, setPriceList] = useState(null)

    const uploadInput = (event) => {
        setInputFile(event.target.files[0])
    }

    const uploadPricelist = (event) => {
        setPriceList(event.target.files[0])
    }


    const postRequest = async () => {
        setLoading(true)

        if (inputFile == null || priceList == null) {
            alert('ensure all files have ben uploaded before proceeding')
            setLoading(false)
            return
        }

        const formData = new FormData();
        formData.append("file", inputFile);
        formData.append("price_list", priceList);

        try {
            await axios.post("https://157.245.198.24/update", formData,
                {
                    headers:
                    {
                        'Content-Disposition': "attachment; filename=output.xlsx",
                        'Content-Type': 'multipart/form-data'
                    },
                    responseType: 'arraybuffer',
                }
            ).then(res => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'output.xlsx');
                document.body.appendChild(link);
                link.click();
            }).catch(err => {
                console.log(err)
                alert(err)
            });
            setLoading(false)
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    return (
        <div className={classes.root}>
            <h1 className={classes.pageTitle}>Input Supplier Price</h1>
            <p className={classes.pageLead}>Fill supplier prices into an input workbook from a price list.</p>
            <div className={classes.fileUploadContainer}>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Input File</span>
                    <Input onChange={(event) => uploadInput(event)} type="file" className={classes.fileUpload} />
                </div>
                <div className={classes.fileUploadWrapper}>
                    <span className={classes.label}>Price List</span>
                    <Input onChange={(event) => uploadPricelist(event)} type="file" className={classes.fileUpload} />
                </div>
            </div>
            <div className={classes.actionRow}>
                <button onClick={() => postRequest()} className={classes.download}>
                    Compile
                </button>
            </div>
            <div className={classes.formatBlock}>
                <h3 className={classes.hint}>The price list needs the layout below. The first cell is the part column, and the rest of the header row is quantities.</h3>
                <img alt="Sample Format" src={require('../assets/Format.png')} className={classes.formatImage} />
            </div>
            <Backdrop
                sx={{ color: '#dc831b', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" thickness={2.4} />
            </Backdrop>
        </div>
    );
}

export default QuotationCompile;