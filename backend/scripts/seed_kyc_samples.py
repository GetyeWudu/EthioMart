"""
scripts/seed_kyc_samples.py
===========================
Generates and uploads realistic sample KYC documents to Cloudinary for testing and admin review.
"""

import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

import django
django.setup()

from PIL import Image, ImageDraw
import cloudinary
import cloudinary.uploader
from django.conf import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
    api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
    api_secret=settings.CLOUDINARY_STORAGE['API_SECRET'],
    secure=True
)

docs = [
    (
        'media/vendors/kyc/fayda_id_sample',
        'FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA',
        'FAYDA NATIONAL DIGITAL ID (ፋይዳ)',
        'Doc #: FYD-2992176296\nFull Name: Sara Melese\nDate of Birth: 12/04/1992\nNationality: Ethiopian\nIssued: 09/09/2026\nAuthority: National ID Program',
        (30, 64, 175)
    ),
    (
        'media/vendors/kyc/passport_or_kebele_sample',
        'FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA',
        'RESIDENT IDENTIFICATION CARD / PASSPORT',
        'Doc #: KEB-03-36296\nHolder Name: Sara Melese\nSubcity: Bole, Kebele: 03\nHouse No: 492\nCity: Addis Ababa, Ethiopia',
        (5, 150, 105)
    ),
    (
        'media/vendors/kyc/tin_certificate_sample',
        'MINISTRY OF REVENUES (የገቢዎች ሚኒስቴር)',
        'TAX IDENTIFICATION NUMBER (TIN) CERTIFICATE',
        'TIN: 1234567890\nTaxpayer Name: Sara Electronics\nRegistered Activity: Retail of Consumer Electronics\nRegistration Date: 09/09/2026\nTax Center: Large Taxpayers Office',
        (180, 83, 9)
    ),
    (
        'media/vendors/kyc/trade_license_sample',
        'MINISTRY OF TRADE & REGIONAL INTEGRATION',
        'PRINCIPAL COMMERCIAL REGISTRATION & TRADE LICENSE',
        'License #: LIC-ADD-36296\nBusiness Name: Sara Electronics\nManager: Sara Melese\nSector: Wholesale and Retail Trade\nStatus: Valid & Renewed for 2026',
        (79, 70, 229)
    ),
]

for public_id, header, title, body, color in docs:
    img = Image.new('RGB', (900, 1200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Border
    draw.rectangle([(20, 20), (880, 1180)], outline=color, width=4)
    # Header Bar
    draw.rectangle([(20, 20), (880, 130)], fill=color)
    
    # Header Text
    draw.text((450, 50), header, fill=(255, 255, 255), anchor='mm')
    draw.text((450, 95), 'OFFICIAL VERIFIED RECORD - ETHIOMART KYC COMPLIANCE', fill=(220, 235, 252), anchor='mm')
    
    # Title
    draw.text((450, 210), title, fill=color, anchor='mm')
    draw.line([(150, 240), (750, 240)], fill=color, width=2)
    
    # Body details
    y = 320
    for line in body.split('\n'):
        draw.text((100, y), line, fill=(30, 41, 59))
        y += 55
        
    # Official Stamp
    draw.ellipse([(580, 750), (800, 970)], outline=color, width=4)
    draw.text((690, 830), 'VERIFIED', fill=color, anchor='mm')
    draw.text((690, 870), 'ETHIOMART KYC', fill=color, anchor='mm')
    draw.text((690, 900), 'APPROVED', fill=color, anchor='mm')
    
    # Footer
    draw.rectangle([(20, 1120), (880, 1180)], fill=(241, 245, 249))
    draw.text((450, 1150), 'Document verified by EthioMart Compliance Department', fill=(100, 116, 139), anchor='mm')
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    res = cloudinary.uploader.upload(
        buf.getvalue(),
        public_id=public_id,
        resource_type='image',
        overwrite=True
    )
    print(f"Uploaded {public_id} -> {res.get('secure_url')}")

print("All sample KYC documents uploaded successfully!")
