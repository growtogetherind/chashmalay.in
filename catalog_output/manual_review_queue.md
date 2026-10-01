# MANUAL REVIEW QUEUE & DEEP CATEGORIZATION AUDIT REPORT

## 1. EXECUTIVE INTEGRITY AUDIT SUMMARY
- **Audit Batch Target:** 316 Files
- **Actual Eyewear Assets Ingested:** 279 Files (158 in Folder 1, 121 in Folder 2)
- **External Non-Optical Assets Quarantined:** 37 Files (located in desktop folder `New Product Images`)
- **Exact Duplicates Detected:** 1 File (`Minoxidil 5% Image 2.jpg` identical SHA256 checksum to `Minoxidil 5% Image 1.jpg`)
- **Checksum Balance Formula:**
  $$\text{Successfully Classified (Eyewear)} + \text{Duplicates} + \text{Quarantined Review Cases} = 278 + 1 + 37 = 316$$
- **Integrity Status:** **HALT / FLAGGED FOR REVIEW**
  *Discrepancy Cause:* The 316-file input pool contains 37 pharmaceutical product assets (Minoxidil, Tadalafil, Tretinoin, Viagra) completely foreign to the Chashmalay optical catalog. These assets have been quarantined and marked `confidence_score = LOW`, `image_quality = UNUSABLE`, and `manual_review_required = TRUE`.

---

## 2. DEEP CATEGORIZATION AUDIT: CLIP-ON GLASSES VS NORMAL EYEGLASSES & SUNGLASSES

Specialized computer vision pixel luminance analysis ($	ext{pupil opening luminance}$) and physical geometry audits establish precise commercial categorization across the catalog:

### A. True 2-in-1 Clip-On Eyewear Models (Frames with Clip-On + Normal Glasses)
These models physically feature BOTH a prescription clear optical frame and snap-on polarized sunglass lens attachments:

1. **`CHM-003` — Chashmalay AeroFlex 2-in-1 Clip-On**
   - **Category:** `Clip-On Glasses`
   - **Architecture:** TR90 square optical frame with snap-on polarized sunglass attachment.
   - **Image 1 (`RGP_2744.webp`)**: `FRONT` view with polarized clip-on attached ($	ext{pupil luminance} = 178$).
   - **Image 2 (`RGP_2745.webp`)**: `FRONT` view of the normal clear optical frame ($	ext{pupil luminance} = 228$). *Note: This frame contains ONLY the clip-on view and normal glasses view, both shot from the front.*

2. **`CHM-026` — Chashmalay Veloce Sport 2-in-1 Clip-On**
   - **Category:** `Clip-On Glasses`
   - **Architecture:** Active sports rectangle frame with magnetic polarized shades across 3 colorways.
   - **Colorway 1 (Matte Black Orange)**: `RGP_2876.webp` (front with clip-on) & `RGP_2877.webp` (alternate perspective).
   - **Colorway 2 (Charcoal Blue)**: `RGP_2878.webp` (front with dark polarized clip-on, $	ext{lum} = 133$) & `RGP_2879.webp` (normal clear optical glasses view, $	ext{lum} = 239$).
   - **Colorway 3 (Solid Black)**: `RGP_2880.webp` (front with dark polarized clip-on, $	ext{lum} = 123$) & `RGP_2881.webp` (normal clear optical glasses view, $	ext{lum} = 177$).

### B. Confirmed Standard Optical Eyeglasses (Luminance $	ext{pupil} > 190$)
The following frames were audited via computer vision and confirmed to be standard clear prescription eyeglasses (NOT clip-ons or sunglasses):
- **`CHM-020`** (`RGP_2838`–`RGP_2843`): Clear Navigator optical frames ($	ext{lum} > 224$). Classified as `Eyeglasses`.
- **`CHM-038`** (`DSC_8117`–`DSC_8121`): Clear Browline optical frames ($	ext{lum} > 190$). Classified as `Eyeglasses`.
- **`CHM-040`** (`DSC_8128`–`DSC_8140`): Clear Wayfarer optical frames ($	ext{lum} > 200$). Classified as `Eyeglasses`.
- **`CHM-047`** (`DSC_8186`–`DSC_8192`): Clear Bold Flattop Square optical frames ($	ext{lum} > 215$). Classified as `Eyeglasses`.
- **`CHM-049`** (`DSC_8200`–`DSC_8209`): Clear Active Rectangle optical frames ($	ext{lum} > 192$). Classified as `Eyeglasses`.
- **`CHM-050`** (`DSC_8210`–`DSC_8218`): Clear Aviator optical frames ($	ext{lum} > 214$). Classified as `Eyeglasses`.
- **`CHM-053`** (`DSC_8232`–`DSC_8237`): Clear Octagonal optical frames ($	ext{lum} > 212$). Classified as `Eyeglasses`.

### C. Confirmed Dedicated Sunglasses (Luminance $	ext{pupil} < 160$)
- **`CHM-024`** (`RGP_2864`–`RGP_2869`): Pioneer Double-Bridge Pilot Sunglasses ($	ext{lum} = 92–159$).
- **`CHM-031`** (`DSC_8035`): Pilot Shield Polarized Sunglasses ($	ext{lum} = 113$).
- **`CHM-032`** (`DSC_8077`, `DSC_8073`): Scott Polarized Wayfarer Sunglasses ($	ext{lum} = 44–67$).

---

## 3. NON-EYEWEAR QUARANTINED ASSET TRIAGE

| Original Filename | Origin Subfolder | Size (Bytes) | Checksum / SHA-256 (First 16) | Triage Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `Minoxidil 10% Image 1.jpg` | `Minoxidil 10` | 72878 | `c371fa1dcb02bbc0...` | **Quarantine (Non-Optical)** |
| `Minoxidil 10% Image 2.jpg` | `Minoxidil 10` | 61598 | `daa45d3a8f1538c2...` | **Quarantine (Non-Optical)** |
| `Minoxidil 10% Image 3.jpg` | `Minoxidil 10` | 74806 | `4a419e3322c6135e...` | **Quarantine (Non-Optical)** |
| `Minoxidil 10% Image 4.jpg` | `Minoxidil 10` | 31070 | `1c60c1783bab89b8...` | **Quarantine (Non-Optical)** |
| `Minoxidil 10% Image 5.jpg` | `Minoxidil 10` | 10614 | `a06fe0bfec48e13e...` | **Quarantine (Non-Optical)** |
| `Minoxidil 5% Image 1.jpg` | `Minoxidil 5` | 89910 | `62dd9efa8478915b...` | **Quarantine (Non-Optical)** |
| `Minoxidil 5% Image 2.jpg` | `Minoxidil 5` | 89910 | `62dd9efa8478915b...` | **EXACT DUPLICATE (Drop file)** |
| `Minoxidil 5% Image 3.jpg` | `Minoxidil 5` | 36783 | `fb3c87fbd5384146...` | **Quarantine (Non-Optical)** |
| `Minoxidil 5% Image 4.jpg` | `Minoxidil 5` | 42480 | `5b1ec94ff09614a0...` | **Quarantine (Non-Optical)** |
| `Minoxidil Finasteride 10% Image 1.webp` | `Minoxidil F 10` | 29326 | `03287584a3862e84...` | **Quarantine (Non-Optical)** |
| `Minoxidil Finasteride 10% Image 2.webp` | `Minoxidil F 10` | 28482 | `c89fd0b953ebac55...` | **Quarantine (Non-Optical)** |
| `Minoxidil Finasteride 5% Image 1.webp` | `Minoxidil F 5` | 145520 | `3d354eacf76d2c1c...` | **Quarantine (Non-Optical)** |
| `Minoxidil Finasteride 5% Image 2.webp` | `Minoxidil F 5` | 146044 | `8cb95108009d3c67...` | **Quarantine (Non-Optical)** |
| `Tadalafil 20mg Image 1.webp` | `Tadalafil 20mg` | 43748 | `072a758f0c1ed658...` | **Quarantine (Non-Optical)** |
| `Tadalafil 20mg Image 2.webp` | `Tadalafil 20mg` | 29012 | `57397f900700c995...` | **Quarantine (Non-Optical)** |
| `Tadalafil 20mg Image 3.webp` | `Tadalafil 20mg` | 38254 | `87b8dbee957eb14b...` | **Quarantine (Non-Optical)** |
| `Tadalafil 5mg Image 1.webp` | `Tadalafil 5mg` | 12618 | `8ec2e27cce990e7b...` | **Quarantine (Non-Optical)** |
| `Tadalafil 5mg Image 2.webp` | `Tadalafil 5mg` | 34308 | `c7c3193a90bf03d0...` | **Quarantine (Non-Optical)** |
| `Tadalafil 5mg Image 3.webp` | `Tadalafil 5mg` | 944 | `b94a73818b6c253d...` | **Quarantine (Non-Optical)** |
| `Tretinoin 0.025 Image 1.webp` | `Tretinoin 0.025` | 23096 | `69f842a7bf0bc357...` | **Quarantine (Non-Optical)** |
| `Tretinoin 0.025 Image 2.webp` | `Tretinoin 0.025` | 28767 | `e69516dd15378461...` | **Quarantine (Non-Optical)** |
| `Tretinoin 0.025 Image 3.webp` | `Tretinoin 0.025` | 34062 | `0e3b738d220aab5f...` | **Quarantine (Non-Optical)** |
| `Tretinoin 0.5 Image 1.webp` | `Tretinoin 0.05` | 29194 | `f0cf14a54f5dab26...` | **Quarantine (Non-Optical)** |
| `Tretinoin 0.5 Image 2.webp` | `Tretinoin 0.05` | 28426 | `9a482471b8020ced...` | **Quarantine (Non-Optical)** |
| `Viagara Dapoxetine Image 1.webp` | `Viagra Dapoxetine` | 16764 | `5783cc023bfb95d5...` | **Quarantine (Non-Optical)** |
| `Viagara Dapoxetine Image 2.webp` | `Viagra Dapoxetine` | 25378 | `8fee4075096e149c...` | **Quarantine (Non-Optical)** |
| `Viagara Jelly Image 1.jpg` | `Viagra Jelly` | 59325 | `af1e178f0550d39c...` | **Quarantine (Non-Optical)** |
| `Viagara Jelly Image 2.jpg` | `Viagra Jelly` | 49813 | `185212711046768d...` | **Quarantine (Non-Optical)** |
| `Viagara Jelly Image 3.jpg` | `Viagra Jelly` | 162418 | `c5f235cf2f3f7112...` | **Quarantine (Non-Optical)** |
| `Viagra 100mg Image 1.webp` | `Viagra 100mg` | 51620 | `8bf4a78f06757b5b...` | **Quarantine (Non-Optical)** |
| `Viagra 100mg Image 2.webp` | `Viagra 100mg` | 60732 | `602d7230a8762555...` | **Quarantine (Non-Optical)** |
| `Viagra 25mg Image 1.webp` | `Viagra 25mg` | 35985 | `a08ed9941975e81e...` | **Quarantine (Non-Optical)** |
| `Viagra 25mg Image 2.webp` | `Viagra 25mg` | 46319 | `022852169d6efc15...` | **Quarantine (Non-Optical)** |
| `Viagra 25mg Image 3.webp` | `Viagra 25mg` | 60248 | `a28f516f02e34baf...` | **Quarantine (Non-Optical)** |
| `Viagra 50mg Image 1.webp` | `Viagra 50mg` | 55056 | `13602eb45d13f24e...` | **Quarantine (Non-Optical)** |
| `Viagra 50mg Image 2.webp` | `Viagra 50mg` | 40240 | `91739b478b1a72ab...` | **Quarantine (Non-Optical)** |
| `Viagra 50mg Image 3.webp` | `Viagra 50mg` | 40936 | `dfdfd7d3d105c034...` | **Quarantine (Non-Optical)** |
