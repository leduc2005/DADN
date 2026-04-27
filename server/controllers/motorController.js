const MotorService = require('../services/MotorService');

exports.searchMotorData = async (req, res) => {
    try {
        const { Pct, Nsb, Tmm_over_T = 1.3 } = req.body;

        if (Pct === undefined || Nsb === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu trường bắt buộc: Pct và Nsb',
            });
        }

        const requiredPower = Number(Pct);
        const requiredSpeed = Number(Nsb);
        const requiredTorqueRatio = Number(Tmm_over_T);

        if (!Number.isFinite(requiredPower) || !Number.isFinite(requiredSpeed)) {
            return res.status(400).json({
                success: false,
                message: 'Pct và Nsb phải là số hợp lệ',
            });
        }

        if (requiredPower <= 0 || requiredSpeed <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Pct và Nsb phải lớn hơn 0',
            });
        }

        const items = MotorService.suggestMotors(
            requiredPower,
            requiredSpeed,
            Number.isFinite(requiredTorqueRatio) ? requiredTorqueRatio : 1.3,
        ).map((motor) => ({
            motorId: motor.motorId,
            motorType: motor.motorType,
            ratedPower: motor.ratedPower,
            motorSpeed: motor.motorSpeed,
            syncSpeed: motor.syncSpeed,
            efficiency: motor.efficiency,
            powerFactor: motor.powerFactor,
            overloadRatio: motor.overloadRatio,
            shaftDiameter: motor.shaftDiameter,
            model: motor.model,
            power: motor.power,
            speed: motor.speed,
            Tmm_Tdn: motor.Tmm_Tdn,
        }));

        return res.status(200).json({
            success: true,
            items,
            total: items.length,
            calculation: {
                Pct: requiredPower,
                Nsb: requiredSpeed,
                Tmm_over_T: Number.isFinite(requiredTorqueRatio) ? requiredTorqueRatio : 1.3,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm kiếm motor',
            error: error.message,
        });
    }
};
