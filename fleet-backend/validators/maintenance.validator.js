const validPriority = ['low', 'medium', 'high'];

const validStatus = [
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
];


export const validateCreateMaintenance = (req, res, next) => {

    const {
        vehiclePlate,
        scheduledDate,
        technician,
        cost,
        priority,
        status
    } = req.body;


    if (!vehiclePlate)
        return res.status(400).json({
            success: false,
            message: 'vehiclePlate required'
        });


    if (!scheduledDate)
        return res.status(400).json({
            success: false,
            message: 'scheduledDate required'
        });


    if (!technician)
        return res.status(400).json({
            success: false,
            message: 'technician required'
        });


    if (cost == null || cost < 0)
        return res.status(400).json({
            success: false,
            message: 'valid cost required'
        });


    if (priority && !validPriority.includes(priority))
        return res.status(400).json({
            success: false,
            message: 'invalid priority'
        });


    if (status && !validStatus.includes(status))
        return res.status(400).json({
            success: false,
            message: 'invalid status'
        });


    next();
};