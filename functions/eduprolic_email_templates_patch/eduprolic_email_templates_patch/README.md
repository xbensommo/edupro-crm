# EduProLIC Email Templates Patch

Drop these files into your project:

```text
functions/config.js
functions/emailTemplates.js
public/brand/edupro-logo.png
```

The template theme uses the EduPro palette:

```text
Primary:   #8E6E4E
Gold:      #C5A059
Navy:      #0D1B2A
Canvas:    #FCFAF7
Text:      #1A1A1A
Muted:     #575757
```

Important: the email logo needs a hosted URL. Deploy `public/brand/edupro-logo.png` to Firebase Hosting or any public HTTPS asset location, then set `BRAND_LOGO_URL`.
