#pragma once
#include <queue>
#include <iostream>
#include <memory>
#include "IPercentileTracker.h"
class MonitoringApp {
private:
    std::unique_ptr<IPercentileTracker> structure_a; 
    std::unique_ptr<IPercentileTracker> structure_b; 
    std::unique_ptr<IPercentileTracker> oracle; 
    std::queue<std::pair<long long, double>> sliding_window; 
    size_t window_size;
    double alert_threshold;
public:
    MonitoringApp(size_t w, double threshold, 
                  std::unique_ptr<IPercentileTracker> a, 
                  std::unique_ptr<IPercentileTracker> b,
                  std::unique_ptr<IPercentileTracker> o) 
        : window_size(w), alert_threshold(threshold), 
          structure_a(std::move(a)), structure_b(std::move(b)), oracle(std::move(o)) {}
    void process_reading(long long id, double value) {
        if (structure_a) structure_a->insert(id, value);
        if (structure_b) structure_b->insert(id, value);
        if (oracle) oracle->insert(id, value);
        sliding_window.push({id, value});
        if (sliding_window.size() > window_size) {
            auto expired_reading = sliding_window.front();
            sliding_window.pop();
            if (structure_a) structure_a->retract(expired_reading.first);
            if (structure_b) structure_b->retract(expired_reading.first);
            if (oracle) oracle->retract(expired_reading.first);
        }
        double current_median = structure_a ? structure_a->query(0.50) : 0;
        double current_90th   = structure_b ? structure_b->query(0.90) : 0;
        if (structure_b && current_90th > alert_threshold) {
            std::cout << "[ALERT] Threshold exceeded at reading ID " << id 
                      << " | Median: " << current_median 
                      << " | 90th Percentile: " << current_90th << "\n";
        }
    }
};
