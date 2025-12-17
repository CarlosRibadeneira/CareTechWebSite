# CareTech Innovations LLC - Website

Official website for CareTech Innovations LLC, a technology consulting and software development company.

## 🌐 Live Site

- **Production:** https://caretech.com (once domain is configured)
- **GitHub Pages:** https://YOUR_USERNAME.github.io/caretech-website

## 🛠️ Technology Stack

- **Template:** [Stellar by HTML5 UP](https://html5up.net/stellar)
- **Hosting:** GitHub Pages (free)
- **Domain:** Cloudflare Registrar

## 📁 Project Structure

```
website/
├── index.html          # Main landing page
├── assets/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   ├── sass/          # SASS source files
│   └── webfonts/      # Font Awesome fonts
├── images/            # Site images
├── CNAME              # Custom domain configuration
└── README.md          # This file
```

## 🚀 Deployment

This site is automatically deployed via GitHub Pages when changes are pushed to the `main` branch.

### Setup Instructions

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Set Source to "Deploy from a branch"
4. Select `main` branch, `/ (root)` folder
5. Add custom domain in the Custom domain field
6. Enable "Enforce HTTPS"

### DNS Configuration (Cloudflare)

Add these records to point your domain to GitHub Pages:

**A Records (root domain):**
| Type | Name | Content |
|------|------|---------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**CNAME Record (www subdomain):**
| Type | Name | Content |
|------|------|---------|
| CNAME | www | YOUR_USERNAME.github.io |

## 📝 Customization

### Update Content

Edit `index.html` to modify:
- Company description
- Services offered
- Contact information
- Social media links

### Update Styling

- Modify `assets/css/main.css` for quick style changes
- Edit files in `assets/sass/` for comprehensive styling (requires SASS compilation)

### Update Images

Replace images in the `images/` folder:
- `logo.svg` - Company logo
- `pic01.jpg` - Hero section image

## 📄 License

- **Website Content:** © 2025 CareTech Innovations LLC
- **Template:** [Creative Commons Attribution 3.0](https://html5up.net/license) - HTML5 UP
