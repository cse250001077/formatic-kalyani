#include "../include/MonitoringApp.h"
#include <iostream>
class MockTracker : public IPercentileTracker {
private:
    double last_value = 0;
public:
    void insert(long long id, double value) override { last_value = value; }
    void retract(long long id) override {}
    double query(double p) override { 
        if (p == 0.90) return last_value + 200; 
        return last_value; 
    }
};
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::unique_ptr<IPercentileTracker> struct_a = std::make_unique<MockTracker>();
    std::unique_ptr<IPercentileTracker> struct_b = std::make_unique<MockTracker>();
    std::unique_ptr<IPercentileTracker> oracle_ptr = std::make_unique<MockTracker>();
    MonitoringApp app(10, 1150.0, std::move(struct_a), std::move(struct_b), std::move(oracle_ptr));
    std::cout << "Starting stream processing test...\n";
    for (long long i = 1; i <= 20; i++) {
        double simulated_value = (i * 100) % 1000; 
        std::cout << "Reading ID " << i << " | Value: " << simulated_value << "\n";
        app.process_reading(i, simulated_value);
    }
    std::cout << "Stream processing complete.\n";
    return 0;
}
