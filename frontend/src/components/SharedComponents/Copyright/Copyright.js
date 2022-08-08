import React from 'react';
import {Typography, Link} from '@material-ui/core';

export default function Copyright() {
    return (
        <div>
            <Typography variant="body2" color="textSecondary" align="center">
                {'Copyright © '}
                <Link color="inherit" href="#">
                    CPMS
                </Link>{' '}
                {new Date().getFullYear()}
                {'.'}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
                <Link style={{ color: 'inherit', textDecoration: 'inherit' }} href="https://www.linkedin.com/in/alex-druzina-0218141b4/">Alex Druzina</Link>, <Link style={{ color: 'inherit', textDecoration: 'inherit' }} href="https://www.linkedin.com/in/moshe-didi-b86765154/">Moshe Didi</Link>, <Link style={{ color: 'inherit', textDecoration: 'inherit' }} href="https://www.linkedin.com/in/amit-feiner-0021071ba/">Amit Feiner</Link>, Yamit Gvinter
            </Typography>
        </div>
    );
}