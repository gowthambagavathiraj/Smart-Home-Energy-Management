package com.smarthome.service;

import com.smarthome.model.Device;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

@Service
public class DummyIotPowerService {

    /**
     * Dummy IoT power reading simulator.
     * Keeps integration isolated so a real provider can replace this service later.
     */
    public double readLivePowerKw(Device device) {
        if (!"ON".equals(device.getStatus())) {
            return 0.0;
        }

        double minFactor = 0.55;
        double maxFactor = 1.00;
        double factor = ThreadLocalRandom.current().nextDouble(minFactor, maxFactor);
        return round(device.getPowerRating() * factor);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
