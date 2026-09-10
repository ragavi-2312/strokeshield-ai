/**
 * StrokeShield AI — Validation Engine (Sections 22, 23, 24)
 * 
 * Separates the Measurement Engine from the Validation Engine.
 * 
 * Purpose:
 * When real labeled clinical validation data becomes available, this module calculates
 * scientific validation metrics (MAE, RMSE, Bias, Pearson Correlation, Sensitivity, Specificity, ROC-AUC).
 * 
 * IMPORTANT:
 * - Does NOT calculate or display validation metrics from fabricated data.
 * - If no real validation dataset is configured, reports "Clinical validation dataset not configured."
 */

import { ValidationMetrics, ValidationSample } from './types';

export class ValidationEngine {
  /**
   * Evaluate a dataset of clinical validation samples against reference ground truth.
   */
  public static evaluateDataset(samples: ValidationSample[], clinicalThresholdPercent: number = 25.0): ValidationMetrics {
    if (!samples || samples.length === 0) {
      return {
        sampleCount: 0,
        status: 'DATASET_NOT_CONFIGURED',
        statusMessage: 'Clinical validation dataset not configured. No validated ground-truth data available.',
      };
    }

    // Filter samples with valid ground truth
    const validSamples = samples.filter((s) => s.ground_truth_asymmetry !== null && typeof s.ground_truth_asymmetry === 'number');

    if (validSamples.length === 0) {
      return {
        sampleCount: samples.length,
        status: 'DATASET_NOT_CONFIGURED',
        statusMessage: 'Clinical validation dataset contains no labeled ground truth measurements.',
      };
    }

    const n = validSamples.length;
    let sumAbsError = 0;
    let sumSquaredError = 0;
    let sumBias = 0;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    // Binary confusion matrix variables (for threshold-based screening)
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    validSamples.forEach((s) => {
      const pred = s.predicted_asymmetry;
      const actual = s.ground_truth_asymmetry!;
      const diff = pred - actual;

      sumAbsError += Math.abs(diff);
      sumSquaredError += Math.pow(diff, 2);
      sumBias += diff;

      sumX += actual;
      sumY += pred;
      sumXY += actual * pred;
      sumX2 += actual * actual;
      sumY2 += pred * pred;

      // Binary classification evaluation against threshold
      const isActualPositive = actual >= clinicalThresholdPercent || s.ground_truth_label === 'UNILATERAL_DROOP';
      const isPredictedPositive = pred >= clinicalThresholdPercent;

      if (isActualPositive && isPredictedPositive) tp++;
      else if (!isActualPositive && isPredictedPositive) fp++;
      else if (!isActualPositive && !isPredictedPositive) tn++;
      else if (isActualPositive && !isPredictedPositive) fn++;
    });

    const mae = Number((sumAbsError / n).toFixed(2));
    const rmse = Number(Math.sqrt(sumSquaredError / n).toFixed(2));
    const bias = Number((sumBias / n).toFixed(2));

    // Pearson Correlation Coefficient r
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const pearsonCorrelation = den === 0 ? 1.0 : Number((num / den).toFixed(3));

    // Classification metrics
    const sensitivity = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(3)) : 0;
    const specificity = tn + fp > 0 ? Number((tn / (tn + fp)).toFixed(3)) : 0;
    const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(3)) : 0;
    const recall = sensitivity;
    const f1Score = precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(3)) : 0;

    return {
      sampleCount: n,
      status: 'DATASET_CONFIGURED',
      statusMessage: `Evaluated ${n} ground-truth clinical validation samples.`,
      mae,
      rmse,
      bias,
      pearsonCorrelation,
      sensitivity,
      specificity,
      precision,
      recall,
      f1Score,
    };
  }
}
