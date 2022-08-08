import pdfkit


def html_to_pdf(body):
    path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
    # pdfkit.from_url("http://google.com", "out.pdf", configuration=config)
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body>""" + body + """<body>
    </html>
    """
    pdfkit.from_string(html_content, 'out.pdf', configuration=config)


if __name__ == '__main__':
    html_to_pdf("<p>הערות:</p>")
