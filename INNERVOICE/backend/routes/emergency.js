const express = require("express");
const router = express.Router();


// =====================================================
// GET /api/emergency/resources
// Public endpoint for verified crisis & emergency lines
// No authentication required (safety-first access)
// =====================================================

router.get("/resources", (req, res) => {
    res.status(200).json({
        success: true,
        country: "India",
        emergency_number: "112",
        disclaimer: "INNERVOICE provides wellness and self-reflection support. It is not a medical or emergency provider. If you or someone you know is in immediate danger, please reach out to emergency services immediately.",
        resources: [
            {
                name: "National Emergency Helpline",
                number: "112",
                tel: "tel:112",
                description: "All-in-one 24/7 national emergency response (Police, Fire, Medical & Disaster)",
                badge: "24/7 National Emergency",
                type: "emergency"
            },
            {
                name: "Tele-MANAS (Govt. of India)",
                number: "14416 / 1800-891-4416",
                tel: "tel:14416",
                description: "24/7 Toll-Free National Tele-Mental Health Helpline across Indian languages",
                badge: "Toll-Free 24/7 Mental Health",
                type: "mental_health"
            },
            {
                name: "KIRAN Helpline (Govt. of India)",
                number: "1800-599-0019",
                tel: "tel:18005990019",
                description: "24/7 Mental Health Rehabilitation Helpline by Ministry of Social Justice & Empowerment",
                badge: "Toll-Free 24/7 Support",
                type: "mental_health"
            }
        ]
    });
});


module.exports = router;
