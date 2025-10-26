package services

import (
    "context"
    "time"

    awscfg "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatch"
    cwtypes "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
)

type CloudWatchService struct {
    client *cloudwatch.Client
}

func NewCloudWatchService(ctx context.Context, region string) (*CloudWatchService, error) {
    cfg, err := awscfg.LoadDefaultConfig(ctx, awscfg.WithRegion(region))
    if err != nil {
        return nil, err
    }
    return &CloudWatchService{client: cloudwatch.NewFromConfig(cfg)}, nil
}

type MetricQueryInput struct {
    Namespace  string
    MetricName string
    Dimensions map[string]string
    Stat       string // Average, Sum, etc.
    Period     int32  // seconds
    StartTime  time.Time
    EndTime    time.Time
}

type MetricSeries struct {
    Timestamps []time.Time
    Values     []float64
}

func (s *CloudWatchService) GetMetricSeries(ctx context.Context, in MetricQueryInput) (MetricSeries, error) {
    dims := make([]cwtypes.Dimension, 0, len(in.Dimensions))
    for k, v := range in.Dimensions {
        dims = append(dims, cwtypes.Dimension{Name: &k, Value: &v})
    }

    metricStat := &cwtypes.MetricStat{
        Metric: &cwtypes.Metric{
            Namespace: &in.Namespace,
            MetricName: &in.MetricName,
            Dimensions: dims,
        },
        Period: &in.Period,
        Stat:   &in.Stat,
    }

    id := "m1"
    query := cwtypes.MetricDataQuery{
        Id:         &id,
        MetricStat: metricStat,
        ReturnData: awsBool(true),
    }

    out, err := s.client.GetMetricData(ctx, &cloudwatch.GetMetricDataInput{
        StartTime:         &in.StartTime,
        EndTime:           &in.EndTime,
        MetricDataQueries: []cwtypes.MetricDataQuery{query},
        ScanBy:            cwtypes.ScanByTimestampAscending,
    })
    if err != nil {
        return MetricSeries{}, err
    }

    series := MetricSeries{}
    if len(out.MetricDataResults) == 0 {
        return series, nil
    }
    res := out.MetricDataResults[0]
    series.Timestamps = res.Timestamps
    series.Values = res.Values
    return series, nil
}

func awsBool(b bool) *bool { return &b }


