/**
 * Source File Validator Service (Phase 2)
 *
 * Validates YAML/JSON source files against the Documentation Robotics specification.
 * Provides detailed validation reports with categorized issues.
 *
 * Features:
 * - Manifest validation
 * - Element syntax and semantic validation
 * - Relationship validation
 * - Cross-layer reference validation
 * - Naming convention enforcement
 * - Integrity checking
 *
 * Usage:
 * ```typescript
 * const validator = new SourceFileValidator();
 * const report = validator.validate(model, sourceFiles);
 *
 * if (!report.isValid) {
 *   console.error('Validation failed:', report.summary);
 *   report.issues.forEach(issue => console.error(issue.message));
 * }
 * ```
 */

import {
  MetaModel,
  YAMLManifest,
  YAMLLayerConfig,
  ValidationIssue,
  ValidationIssueType,
  ValidationSeverity,
  SourceValidationReport,
  SourceFileMetadata,
  ValidationOptions,
} from '../../types';

export class SourceFileValidator {
  /**
   * Default validation options
   */
  private static readonly DEFAULT_OPTIONS: ValidationOptions = {
    validateManifest: true,
    validateManifestVersion: true,
    validateFileExistence: true,
    validateFileSyntax: true,
    validateElementIds: true,
    validateElementTypes: true,
    validateNamingConventions: true,
    enforceIdFormat: true,
    validateRelationshipTargets: true,
    validateRelationshipTypes: true,
    detectCircularDependencies: true,
    validateCrossLayerReferences: true,
    stopOnFirstError: false,
    includeWarnings: true,
  };

  /**
   * ID format pattern for element validation
   * Expected format: {layer}.{type}.{kebab-case-name}
   */
  private static readonly ID_PATTERN = /^[a-z]+\.[a-z]+\.[a-z0-9-]+$/;

  constructor(private options: ValidationOptions = {}) {
    this.options = { ...SourceFileValidator.DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate source files and model against specification
   *
   * @param model - The loaded MetaModel to validate
   * @param sourceFiles - Metadata about loaded source files
   * @param manifest - Optional manifest for additional validation
   * @returns Comprehensive validation report
   */
  validate(
    model: MetaModel,
    sourceFiles: SourceFileMetadata[],
    manifest?: YAMLManifest
  ): SourceValidationReport {
    const issues: ValidationIssue[] = [];
    const report: SourceValidationReport = {
      isValid: true,
      timestamp: new Date(),
      summary: '',
      manifestValid: true,
      manifestIssues: [],
      filesChecked: sourceFiles.length,
      filesValid: 0,
      fileIssues: [],
      elementsFound: 0,
      elementsValid: 0,
      elementIssues: [],
      relationshipsFound: 0,
      relationshipsValid: 0,
      relationshipIssues: [],
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      issues: [],
    };

    // Validate manifest if provided
    if (this.options.validateManifest && manifest) {
      this.validateManifest(manifest, issues);
      report.manifestIssues = issues.filter(i => i.type.includes('manifest'));
      report.manifestValid = report.manifestIssues.every(i => i.severity !== ValidationSeverity.Error);
    }

    // Validate source files
    this.validateSourceFiles(sourceFiles, issues);
    report.fileIssues = issues.filter(i => i.type.includes('layer') || i.type.includes('file'));
    report.filesValid = sourceFiles.filter(f => f.validationStatus === 'valid').length;

    // Validate elements
    this.validateElements(model, issues);
    report.elementIssues = issues.filter(i => i.type.includes('element'));

    // Validate relationships
    this.validateRelationships(model, issues);
    report.relationshipIssues = issues.filter(i => i.type.includes('relationship'));

    // Validate cross-layer references
    if (this.options.validateCrossLayerReferences) {
      this.validateCrossLayerReferences(model, issues);
    }

    // Count elements and relationships
    Object.values(model.layers).forEach(layer => {
      if (layer.elements) {
        report.elementsFound += layer.elements.length;
      }
      if (layer.relationships) {
        report.relationshipsFound += layer.relationships.length;
      }
    });

    // Determine validity and counts
    report.totalIssues = issues.length;
    report.errorCount = issues.filter(i => i.severity === ValidationSeverity.Error).length;
    report.warningCount = issues.filter(i => i.severity === ValidationSeverity.Warning).length;
    report.infoCount = issues.filter(i => i.severity === ValidationSeverity.Info).length;

    report.isValid = report.errorCount === 0 && report.manifestValid;
    report.issues = issues;

    // Generate summary
    report.summary = this.generateSummary(report);

    return report;
  }

  /**
   * Validate manifest structure
   */
  private validateManifest(manifest: YAMLManifest, issues: ValidationIssue[]): void {
    // Check required fields
    if (!manifest.version) {
      issues.push({
        type: ValidationIssueType.InvalidManifestVersion,
        severity: ValidationSeverity.Error,
        message: 'Manifest missing required field: version',
      });
    }

    if (!manifest.project) {
      issues.push({
        type: ValidationIssueType.InvalidProjectInfo,
        severity: ValidationSeverity.Error,
        message: 'Manifest missing required field: project',
      });
    }

    if (!manifest.layers || Object.keys(manifest.layers).length === 0) {
      issues.push({
        type: ValidationIssueType.LayerConfigMissing,
        severity: ValidationSeverity.Error,
        message: 'Manifest must define at least one layer',
      });
    }

    // Validate project info
    if (manifest.project) {
      if (!manifest.project.name) {
        issues.push({
          type: ValidationIssueType.InvalidProjectInfo,
          severity: ValidationSeverity.Error,
          message: 'Project missing required field: name',
        });
      }
    }

    // Validate layer configurations
    if (manifest.layers) {
      Object.entries(manifest.layers).forEach(([layerKey, layerConfig]) => {
        this.validateLayerConfig(layerKey, layerConfig, issues);
      });
    }

    // Validate statistics if present
    if (manifest.statistics) {
      if (manifest.statistics.completeness < 0 || manifest.statistics.completeness > 100) {
        issues.push({
          type: ValidationIssueType.DataInconsistency,
          severity: ValidationSeverity.Warning,
          message: `Layer "${manifest.project?.name}" has invalid completeness score: ${manifest.statistics.completeness}`,
          location: { layer: manifest.project?.name },
        });
      }
    }
  }

  /**
   * Validate individual layer configuration
   */
  private validateLayerConfig(
    layerKey: string,
    config: YAMLLayerConfig,
    issues: ValidationIssue[]
  ): void {
    if (!config.path) {
      issues.push({
        type: ValidationIssueType.InvalidLayerPath,
        severity: ValidationSeverity.Error,
        message: `Layer "${layerKey}" missing required field: path`,
        location: { layer: layerKey },
      });
    }

    if (!config.schema) {
      issues.push({
        type: ValidationIssueType.InvalidLayerSchema,
        severity: ValidationSeverity.Warning,
        message: `Layer "${layerKey}" missing schema reference`,
        location: { layer: layerKey },
      });
    }

    if (typeof config.order !== 'number') {
      issues.push({
        type: ValidationIssueType.LayerConfigMissing,
        severity: ValidationSeverity.Warning,
        message: `Layer "${layerKey}" missing or invalid order`,
        location: { layer: layerKey },
      });
    }
  }

  /**
   * Validate source files
   */
  private validateSourceFiles(sourceFiles: SourceFileMetadata[], issues: ValidationIssue[]): void {
    sourceFiles.forEach(file => {
      if (file.validationStatus === 'invalid' && file.validationErrors) {
        file.validationErrors.forEach(error => {
          issues.push({
            type: ValidationIssueType.ElementSyntaxError,
            severity: ValidationSeverity.Error,
            message: `File "${file.fileName}" has syntax error: ${error}`,
            location: { file: file.filePath },
          });
        });
      }

      if (this.options.validateFileSize && file.fileSize > (this.options.maxFileSize || 10 * 1024 * 1024)) {
        issues.push({
          type: ValidationIssueType.LayerFileMissing,
          severity: ValidationSeverity.Warning,
          message: `File "${file.fileName}" exceeds recommended size: ${(file.fileSize / 1024 / 1024).toFixed(2)}MB`,
          location: { file: file.filePath },
        });
      }
    });
  }

  /**
   * Validate all elements in the model
   */
  private validateElements(model: MetaModel, issues: ValidationIssue[]): void {
    const seenIds = new Set<string>();

    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (!layer.elements) return;

      layer.elements.forEach(element => {

        // Check element ID format
        if (this.options.validateElementIds) {
          if (!element.id) {
            issues.push({
              type: ValidationIssueType.InvalidElementId,
              severity: ValidationSeverity.Error,
              message: `Element "${element.name}" in layer "${layerId}" missing ID`,
              location: { layer: layerId, element: element.name },
            });
          } else if (this.options.enforceIdFormat && !SourceFileValidator.ID_PATTERN.test(element.id)) {
            issues.push({
              type: ValidationIssueType.NamingConventionViolation,
              severity: ValidationSeverity.Warning,
              message: `Element ID "${element.id}" does not match expected format: {layer}.{type}.{kebab-case-name}`,
              location: { layer: layerId, element: element.id },
              suggestedFix: `Consider renaming to match format: ${layerId}.${element.type}.${this.toKebabCase(element.name)}`,
            });
          }

          // Check for duplicate IDs
          if (seenIds.has(element.id)) {
            issues.push({
              type: ValidationIssueType.DuplicateElementId,
              severity: ValidationSeverity.Error,
              message: `Duplicate element ID "${element.id}" found in layer "${layerId}"`,
              location: { layer: layerId, element: element.id },
            });
          }
          seenIds.add(element.id);
        }

        // Check required fields
        if (!element.name) {
          issues.push({
            type: ValidationIssueType.MissingRequiredField,
            severity: ValidationSeverity.Error,
            message: `Element with ID "${element.id}" missing required field: name`,
            location: { layer: layerId },
          });
        }

        if (this.options.validateElementTypes && !element.type) {
          issues.push({
            type: ValidationIssueType.InvalidElementType,
            severity: ValidationSeverity.Error,
            message: `Element "${element.name}" in layer "${layerId}" missing type`,
            location: { layer: layerId, element: element.name },
          });
        }
      });
    });
  }

  /**
   * Validate all relationships in the model
   */
  private validateRelationships(model: MetaModel, issues: ValidationIssue[]): void {
    const elementIdMap = new Map<string, { layerId: string; element: any }>();

    // Build element ID map
    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (layer.elements) {
        layer.elements.forEach(element => {
          elementIdMap.set(element.id, { layerId, element });
        });
      }
    });

    // Validate each relationship
    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (!layer.relationships) return;

      layer.relationships.forEach(relationship => {
        // Check target existence
        if (this.options.validateRelationshipTargets) {
          const sourceExists = elementIdMap.has(relationship.sourceId);
          const targetExists = elementIdMap.has(relationship.targetId);

          if (!sourceExists) {
            issues.push({
              type: ValidationIssueType.MissingRelationshipTarget,
              severity: ValidationSeverity.Error,
              message: `Relationship "${relationship.type}" references missing source element: "${relationship.sourceId}"`,
              location: { layer: layerId, element: relationship.id },
            });
          }

          if (!targetExists) {
            issues.push({
              type: ValidationIssueType.MissingRelationshipTarget,
              severity: ValidationSeverity.Error,
              message: `Relationship "${relationship.type}" references missing target element: "${relationship.targetId}"`,
              location: { layer: layerId, element: relationship.id },
            });
          }
        }

        // Validate relationship type
        if (this.options.validateRelationshipTypes && !relationship.type) {
          issues.push({
            type: ValidationIssueType.InvalidRelationshipType,
            severity: ValidationSeverity.Error,
            message: `Relationship "${relationship.id}" missing type`,
            location: { layer: layerId },
          });
        }
      });
    });
  }

  /**
   * Validate cross-layer references
   */
  private validateCrossLayerReferences(model: MetaModel, issues: ValidationIssue[]): void {
    if (!model.references) return;

    const elementIdMap = new Map<string, { layerId: string }>();

    // Build element ID map across all layers
    Object.entries(model.layers).forEach(([layerId, layer]) => {
      if (layer.elements) {
        layer.elements.forEach(element => {
          elementIdMap.set(element.id, { layerId });
        });
      }
    });

    // Validate each cross-layer reference
    model.references.forEach(reference => {
      const sourceExists = reference.source.elementId ? elementIdMap.has(reference.source.elementId) : false;
      const targetExists = reference.target.elementId ? elementIdMap.has(reference.target.elementId) : false;

      if (!sourceExists && reference.source.elementId) {
        issues.push({
          type: ValidationIssueType.InvalidCrossLayerTarget,
          severity: ValidationSeverity.Error,
          message: `Cross-layer reference source element not found: "${reference.source.elementId}"`,
          location: {
            element: reference.source.elementId,
          },
        });
      }

      if (!targetExists && reference.target.elementId) {
        issues.push({
          type: ValidationIssueType.InvalidCrossLayerTarget,
          severity: ValidationSeverity.Error,
          message: `Cross-layer reference target element not found: "${reference.target.elementId}"`,
          location: {
            element: reference.target.elementId,
          },
        });
      }
    });
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(report: SourceValidationReport): string {
    if (report.isValid && report.totalIssues === 0) {
      return `✓ Validation passed: ${report.elementsFound} elements, ${report.relationshipsFound} relationships, all valid`;
    }

    const parts: string[] = [];

    if (report.errorCount > 0) {
      parts.push(`${report.errorCount} error${report.errorCount !== 1 ? 's' : ''}`);
    }
    if (report.warningCount > 0) {
      parts.push(`${report.warningCount} warning${report.warningCount !== 1 ? 's' : ''}`);
    }
    if (report.infoCount > 0) {
      parts.push(`${report.infoCount} info`);
    }

    return `✗ Validation failed: ${parts.join(', ')} found`;
  }

  /**
   * Convert text to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^\w\-]+/g, '-')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  }
}
