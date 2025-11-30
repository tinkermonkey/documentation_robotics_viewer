/**
 * Cross-Layer Reference Resolver
 *
 * Resolves cross-layer references from business layer to other layers
 * (motivation, application, data model, security, API, UX).
 */

import { MetaModel, ModelElement, Relationship } from '../types/model';
import { BusinessGraph, CrossLayerLink } from '../types/businessLayer';

/**
 * CrossLayerReferenceResolver - Resolves references between business layer and other layers
 */
export class CrossLayerReferenceResolver {
  private warnings: string[] = [];

  /**
   * Resolve all cross-layer links for business graph
   *
   * @param businessGraph - The business graph to enrich with cross-layer links
   * @param model - The complete documentation model
   * @returns Updated business graph with cross-layer links
   */
  resolveAllLinks(businessGraph: BusinessGraph, model: MetaModel): BusinessGraph {
    console.log('[CrossLayerReferenceResolver] Resolving cross-layer links');
    this.warnings = [];

    const links: CrossLayerLink[] = [];

    // Resolve links to each layer
    links.push(...this.resolveMotivationLinks(businessGraph, model));
    links.push(...this.resolveApplicationLinks(businessGraph, model));
    links.push(...this.resolveDataModelLinks(businessGraph, model));
    links.push(...this.resolveSecurityLinks(businessGraph, model));
    links.push(...this.resolveAPILinks(businessGraph, model));
    links.push(...this.resolveUXLinks(businessGraph, model));

    businessGraph.crossLayerLinks = links;

    console.log(
      `[CrossLayerReferenceResolver] Resolved ${links.length} cross-layer links`
    );

    if (this.warnings.length > 0) {
      console.warn(
        `[CrossLayerReferenceResolver] ${this.warnings.length} warnings:`
      );
      this.warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    return businessGraph;
  }

  /**
   * Resolve links from business layer to motivation layer
   *
   * @param businessGraph - Business graph
   * @param model - Complete model
   * @returns Array of cross-layer links to motivation layer
   */
  resolveMotivationLinks(
    businessGraph: BusinessGraph,
    model: MetaModel
  ): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    // Find motivation layer
    const motivationLayer = this.findLayer(model, 'Motivation');
    if (!motivationLayer) {
      console.log('[CrossLayerReferenceResolver] No motivation layer found');
      return links;
    }

    const motivationElementIds = new Set(
      motivationLayer.elements.map((e: ModelElement) => e.id)
    );

    // Search for 'realizes' relationships from business to motivation
    for (const node of businessGraph.nodes.values()) {
      // Check node properties for motivation references
      const realizesGoals = this.extractReferenceArray(node.properties, 'realizes');
      const supportsGoals = this.extractReferenceArray(node.properties, 'supports');

      for (const goalId of [...realizesGoals, ...supportsGoals]) {
        if (motivationElementIds.has(goalId)) {
          links.push({
            source: node.id,
            target: goalId,
            sourceLayer: 'business',
            targetLayer: 'motivation',
            type: 'realizes',
          });
        } else {
          this.warnings.push(
            `Business node ${node.id} references non-existent motivation element ${goalId}`
          );
        }
      }
    }

    // Also check relationships
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        motivationElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'motivation',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to motivation layer`
    );
    return links;
  }

  /**
   * Resolve links from business layer to application layer
   */
  resolveApplicationLinks(
    businessGraph: BusinessGraph,
    model: MetaModel
  ): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    const applicationLayer = this.findLayer(model, 'Application');
    if (!applicationLayer) {
      console.log('[CrossLayerReferenceResolver] No application layer found');
      return links;
    }

    const applicationElementIds = new Set(
      applicationLayer.elements.map((e: ModelElement) => e.id)
    );

    // Business processes/services may be realized by application components
    for (const edge of businessGraph.edges.values()) {
      if (edge.type === 'realizes' && applicationElementIds.has(edge.target)) {
        links.push({
          source: edge.source,
          target: edge.target,
          sourceLayer: 'business',
          targetLayer: 'application',
          type: 'realizes',
        });
      }
    }

    // Check model references
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        applicationElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'application',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to application layer`
    );
    return links;
  }

  /**
   * Resolve links from business layer to data model layer
   */
  resolveDataModelLinks(
    businessGraph: BusinessGraph,
    model: MetaModel
  ): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    const dataModelLayer = this.findLayer(model, 'DataModel');
    if (!dataModelLayer) {
      console.log('[CrossLayerReferenceResolver] No data model layer found');
      return links;
    }

    const dataModelElementIds = new Set(
      dataModelLayer.elements.map((e: ModelElement) => e.id)
    );

    // Business processes may access data models
    for (const node of businessGraph.nodes.values()) {
      const accessesData = this.extractReferenceArray(node.properties, 'accesses');
      const usesData = this.extractReferenceArray(node.properties, 'uses');

      for (const dataId of [...accessesData, ...usesData]) {
        if (dataModelElementIds.has(dataId)) {
          links.push({
            source: node.id,
            target: dataId,
            sourceLayer: 'business',
            targetLayer: 'data_model',
            type: 'accesses',
          });
        }
      }
    }

    // Check model references
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        dataModelElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'data_model',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to data model layer`
    );
    return links;
  }

  /**
   * Resolve links from business layer to security layer
   */
  resolveSecurityLinks(
    businessGraph: BusinessGraph,
    model: MetaModel
  ): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    const securityLayer = this.findLayer(model, 'Security');
    if (!securityLayer) {
      console.log('[CrossLayerReferenceResolver] No security layer found');
      return links;
    }

    const securityElementIds = new Set(
      securityLayer.elements.map((e: ModelElement) => e.id)
    );

    // Business processes may be secured by roles/permissions
    for (const node of businessGraph.nodes.values()) {
      const securedBy = this.extractReferenceArray(node.properties, 'secured_by');
      const requiresPermissions = this.extractReferenceArray(
        node.properties,
        'requires_permissions'
      );

      for (const securityId of [...securedBy, ...requiresPermissions]) {
        if (securityElementIds.has(securityId)) {
          links.push({
            source: node.id,
            target: securityId,
            sourceLayer: 'business',
            targetLayer: 'security',
            type: 'secured_by',
          });
        }
      }
    }

    // Check model references
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        securityElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'security',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to security layer`
    );
    return links;
  }

  /**
   * Resolve links from business layer to API layer
   */
  resolveAPILinks(
    businessGraph: BusinessGraph,
    model: MetaModel
  ): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    const apiLayer = this.findLayer(model, 'Api');
    if (!apiLayer) {
      console.log('[CrossLayerReferenceResolver] No API layer found');
      return links;
    }

    const apiElementIds = new Set(
      apiLayer.elements.map((e: ModelElement) => e.id)
    );

    // Business services may be exposed via API operations
    for (const node of businessGraph.nodes.values()) {
      if (node.type === 'service') {
        const exposedBy = this.extractReferenceArray(node.properties, 'exposed_by');
        const usesAPI = this.extractReferenceArray(node.properties, 'uses_api');

        for (const apiId of [...exposedBy, ...usesAPI]) {
          if (apiElementIds.has(apiId)) {
            links.push({
              source: node.id,
              target: apiId,
              sourceLayer: 'business',
              targetLayer: 'api',
              type: 'exposed_by',
            });
          }
        }
      }
    }

    // Check model references
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        apiElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'api',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to API layer`
    );
    return links;
  }

  /**
   * Resolve links from business layer to UX layer
   */
  resolveUXLinks(businessGraph: BusinessGraph, model: MetaModel): CrossLayerLink[] {
    const links: CrossLayerLink[] = [];

    const uxLayer = this.findLayer(model, 'Ux');
    if (!uxLayer) {
      console.log('[CrossLayerReferenceResolver] No UX layer found');
      return links;
    }

    const uxElementIds = new Set(uxLayer.elements.map((e: ModelElement) => e.id));

    // Business processes may be triggered by UX interactions
    for (const node of businessGraph.nodes.values()) {
      const triggeredBy = this.extractReferenceArray(node.properties, 'triggered_by');

      for (const uxId of triggeredBy) {
        if (uxElementIds.has(uxId)) {
          links.push({
            source: node.id,
            target: uxId,
            sourceLayer: 'business',
            targetLayer: 'ux',
            type: 'triggered_by',
          });
        }
      }
    }

    // Check model references
    for (const relationship of model.references || []) {
      if (
        relationship.source.elementId &&
        businessGraph.nodes.has(relationship.source.elementId) &&
        relationship.target.elementId &&
        uxElementIds.has(relationship.target.elementId)
      ) {
        links.push({
          source: relationship.source.elementId,
          target: relationship.target.elementId,
          sourceLayer: 'business',
          targetLayer: 'ux',
          type: relationship.type,
        });
      }
    }

    console.log(
      `[CrossLayerReferenceResolver] Found ${links.length} links to UX layer`
    );
    return links;
  }

  /**
   * Get accumulated warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Find layer in model by name (case-insensitive)
   */
  private findLayer(
    model: MetaModel,
    layerName: string
  ): { elements: ModelElement[] } | null {
    const normalizedName = layerName.toLowerCase();

    for (const [key, layer] of Object.entries(model.layers)) {
      if (key.toLowerCase() === normalizedName) {
        return layer as { elements: ModelElement[] };
      }
    }

    return null;
  }

  /**
   * Extract reference array from properties
   * Handles both single values and arrays
   */
  private extractReferenceArray(
    properties: Record<string, unknown>,
    key: string
  ): string[] {
    const value = properties[key];

    if (!value) {
      return [];
    }

    if (typeof value === 'string') {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === 'string') as string[];
    }

    return [];
  }
}
