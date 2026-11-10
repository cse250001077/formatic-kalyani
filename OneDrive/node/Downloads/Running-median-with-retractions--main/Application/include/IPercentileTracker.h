#pragma once
class IPercentileTracker {
public:
    virtual ~IPercentileTracker() = default;
    virtual void insert(long long id, double value) = 0;
    virtual void retract(long long id) = 0;
    virtual double query(double p) = 0; 
};
