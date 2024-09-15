import { NextResponse } from 'next/server'

export async function POST(req) {
    const { data } = await req.json()
    console.log('data', data)
    try {
        const jsonData = 
            {
                "segmentation_masks": {
                  "ventricles": "binary_mask_ventricles.png", // ignore the ventricles mask
                  "cortex": "binary_mask_cortex.png", // ignore the cortex mask
                  "lesions": "binary_mask_lesions.png" // ignore the lesions mask
                },
                "volume_measurements": {
                  "left_lateral_ventricle_volume": 5000,  // in mm^3
                  "right_lateral_ventricle_volume": 5200,  // in mm^3
                  "third_ventricle_width": 3.0,  // in mm
                  "fourth_ventricle_width": 4.0  // in mm
                },
                "intensity_statistics": {
                  "white_matter_isointense": true,
                  "grey_matter_intensity_mean": 80,
                  "grey_matter_intensity_variance": 5
                },
                "abnormalities": {
                  "lesions": [
                    {
                      "type": "hyperintense",
                      "location": "periventricular",
                      "size": {
                        "width": 5.0,
                        "height": 5.0,
                        "depth": 3.0  // in mm
                      }
                    }
                  ],
                  "atrophy": {
                    "cerebellum": false,
                    "frontal_lobe": true
                  },
                  "sinus_anomalies": [
                    {
                      "type": "mucosal_thickening",
                      "location": "maxillary_sinus",
                      "severity": "moderate"
                    }
                  ]
                },
                "roi_descriptions": [
                  "Left lateral ventricle volume is within normal range.",
                  "Right lateral ventricle slightly larger than the left.",
                  "No abnormal signal intensities in the basal ganglia.",
                  "Cerebellum appears normal."
                ]
              };

        return new NextResponse(JSON.stringify(jsonData), {
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new NextResponse(JSON.stringify({ error: { message: error.message } }), {
            status: 500,
        })
    }
}