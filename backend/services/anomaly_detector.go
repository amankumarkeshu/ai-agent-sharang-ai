package services

import "math"

type AnomalyResult struct {
    IsAnomaly      bool
    ZScore         float64
    BaselineMean   float64
    BaselineStd    float64
    ConsecutiveHit bool
}

// DetectZScoreAnomaly computes z-score for the last point against previous window.
// Returns anomaly if |z| >= threshold and last K points all breach in the same direction.
func DetectZScoreAnomaly(values []float64, windowSize int, threshold float64, minConsecutive int, direction string) AnomalyResult {
    n := len(values)
    if n < windowSize+minConsecutive || windowSize <= 1 {
        return AnomalyResult{}
    }

    baseline := values[n-windowSize-minConsecutive : n-minConsecutive]
    mean := mean(baseline)
    std := stddev(baseline, mean)
    if std == 0 {
        return AnomalyResult{IsAnomaly: false, ZScore: 0, BaselineMean: mean, BaselineStd: std}
    }

    // Check last K points
    hits := 0
    for i := n - minConsecutive; i < n; i++ {
        z := (values[i] - mean) / std
        if direction == "below" {
            if z <= -threshold {
                hits++
            }
        } else {
            if z >= threshold {
                hits++
            }
        }
    }

    last := values[n-1]
    zlast := (last - mean) / std
    isAnom := hits == minConsecutive
    return AnomalyResult{
        IsAnomaly:      isAnom,
        ZScore:         zlast,
        BaselineMean:   mean,
        BaselineStd:    std,
        ConsecutiveHit: isAnom,
    }
}

func mean(xs []float64) float64 {
    var s float64
    for _, v := range xs {
        s += v
    }
    return s / float64(len(xs))
}

func stddev(xs []float64, m float64) float64 {
    if len(xs) <= 1 {
        return 0
    }
    var s float64
    for _, v := range xs {
        d := v - m
        s += d * d
    }
    return math.Sqrt(s / float64(len(xs)-1))
}


