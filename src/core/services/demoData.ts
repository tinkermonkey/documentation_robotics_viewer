/**
 * Demo/Sample Data for Testing
 * Provides a sample MetaModel for demonstration purposes
 */

import { MetaModel, LayerType } from '../types';

/**
 * Create a sample MetaModel for demonstration
 */
export function createDemoModel(): MetaModel {
  return {
    version: 'demo-0.1.0',
    name: 'Sample Documentation Model',
    description: 'Demonstration model showing the multi-layer architecture',
    layers: {
      [LayerType.Business]: {
        id: LayerType.Business,
        type: LayerType.Business,
        name: 'Business Layer',
        elements: [
          {
            id: 'biz-1',
            type: 'BusinessProcess',
            name: 'User Registration',
            layerId: LayerType.Business,
            properties: {},
            visual: {
              position: { x: 100, y: 100 },
              size: { width: 160, height: 80 },
              style: { backgroundColor: '#fff3e0', borderColor: '#e65100' }
            }
          },
          {
            id: 'biz-2',
            type: 'BusinessProcess',
            name: 'Order Processing',
            layerId: LayerType.Business,
            properties: {},
            visual: {
              position: { x: 300, y: 100 },
              size: { width: 160, height: 80 },
              style: { backgroundColor: '#fff3e0', borderColor: '#e65100' }
            }
          }
        ],
        relationships: [
          {
            id: 'biz-rel-1',
            type: 'flow',
            sourceId: 'biz-1',
            targetId: 'biz-2'
          }
        ]
      },
      [LayerType.Security]: {
        id: LayerType.Security,
        type: LayerType.Security,
        name: 'Security Layer',
        elements: [
          {
            id: 'sec-1',
            type: 'Role',
            name: 'User',
            layerId: LayerType.Security,
            properties: {
              level: 1
            },
            visual: {
              position: { x: 100, y: 100 },
              size: { width: 120, height: 60 },
              style: { backgroundColor: '#fce4ec', borderColor: '#c2185b' }
            }
          },
          {
            id: 'sec-2',
            type: 'Role',
            name: 'Admin',
            layerId: LayerType.Security,
            properties: {
              level: 2
            },
            visual: {
              position: { x: 300, y: 100 },
              size: { width: 120, height: 60 },
              style: { backgroundColor: '#fce4ec', borderColor: '#c2185b' }
            }
          }
        ],
        relationships: []
      },
      [LayerType.Api]: {
        id: LayerType.Api,
        type: LayerType.Api,
        name: 'API Layer',
        elements: [
          {
            id: 'api-1',
            type: 'APIEndpoint',
            name: 'POST /users',
            layerId: LayerType.Api,
            properties: {
              path: '/users',
              method: 'POST',
              operationId: 'createUser'
            },
            visual: {
              position: { x: 100, y: 100 },
              size: { width: 180, height: 70 },
              style: { backgroundColor: '#e0f2f1', borderColor: '#00695c' }
            }
          },
          {
            id: 'api-2',
            type: 'APIEndpoint',
            name: 'GET /users/:id',
            layerId: LayerType.Api,
            properties: {
              path: '/users/:id',
              method: 'GET',
              operationId: 'getUser'
            },
            visual: {
              position: { x: 320, y: 100 },
              size: { width: 180, height: 70 },
              style: { backgroundColor: '#e0f2f1', borderColor: '#00695c' }
            }
          }
        ],
        relationships: []
      },
      [LayerType.DataModel]: {
        id: LayerType.DataModel,
        type: LayerType.DataModel,
        name: 'Data Model Layer',
        elements: [
          {
            id: 'dm-1',
            type: 'DataModelComponent',
            name: 'User',
            layerId: LayerType.DataModel,
            properties: {
              componentType: 'entity',
              fields: [
                { id: 'f1', name: 'id', type: 'string', required: true },
                { id: 'f2', name: 'email', type: 'string', required: true },
                { id: 'f3', name: 'name', type: 'string', required: true },
                { id: 'f4', name: 'role', type: 'string', required: true }
              ]
            },
            visual: {
              position: { x: 100, y: 100 },
              size: { width: 200, height: 150 },
              style: { backgroundColor: '#f5f5f5', borderColor: '#424242' }
            }
          },
          {
            id: 'dm-2',
            type: 'DataModelComponent',
            name: 'Order',
            layerId: LayerType.DataModel,
            properties: {
              componentType: 'entity',
              fields: [
                { id: 'f1', name: 'id', type: 'string', required: true },
                { id: 'f2', name: 'userId', type: 'string', required: true },
                { id: 'f3', name: 'total', type: 'number', required: true },
                { id: 'f4', name: 'status', type: 'string', required: true }
              ]
            },
            visual: {
              position: { x: 350, y: 100 },
              size: { width: 200, height: 150 },
              style: { backgroundColor: '#f5f5f5', borderColor: '#424242' }
            }
          }
        ],
        relationships: [
          {
            id: 'dm-rel-1',
            type: 'reference',
            sourceId: 'dm-2',
            targetId: 'dm-1',
            properties: {
              sourceField: 'f2',
              targetField: 'f1'
            }
          }
        ]
      }
    },
    references: []
  };
}

/**
 * Load demo data (simulates async loading)
 */
export async function loadDemoData(): Promise<MetaModel> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return createDemoModel();
}
