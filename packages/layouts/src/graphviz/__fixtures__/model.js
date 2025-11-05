"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeModel = exports.issue577View = exports.amazonView = exports.cloud3levels = exports.cloudView = exports.indexView = exports.fakeElements = void 0;
/**
              ┌──────────────────────────────────────────────────┐
              │                      cloud                       │
              │  ┌───────────────────────────────────────────┐   │
              │  │                 frontend                  │   │
┏━━━━━━━━━━┓  │  │   ┏━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓    │   │   ┏━━━━━━━━━━━┓
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┃ customer ┃──┼──┼──▶┃  dashboard  ┃   ┃   adminpanel   ┃◀───┼───┼───┃  support  ┃
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┗━━━━━━━━━━┛  │  │   ┗━━━━━━┳━━━━━━┛   ┗━━━━━━━━┳━━━━━━━┛    │   │   ┗━━━━━━━━━━━┛
              │  └──────────┼───────────────────┼────────────┘   │
              │             ├───────────────────┘                │
              │             │                                    │
              │  ┌──────────┼────────────────────────────────┐   │
              │  │          ▼       backend                  │   │
              │  │   ┏━━━━━━━━━━━━━┓       ┏━━━━━━━━━━━━━┓   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┃  graphlql   ┃──────▶┃   storage   ┃   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┗━━━━━━━━━━━━━┛       ┗━━━━━━┳━━━━━━┛   │   │
              │  └────────────────────────────────┼──────────┘   │
              └───────────────────────────────────┼──────────────┘
                                                  │
                                        ┌─────────┼─────────┐
                                        │ amazon  │         │
                                        │         ▼         │
                                        │ ┏━━━━━━━━━━━━━━┓  │
                                        │ ┃              ┃  │
                                        │ ┃      s3      ┃  │
                                        │ ┃              ┃  │
                                        │ ┗━━━━━━━━━━━━━━┛  │
                                        └───────────────────┘

specification {
  element actor
  element system
  element component
}

model {

  actor customer
  actor support

  system cloud {
    component backend {
      component graphql
      component storage

      graphql -> storage
    }

    component frontend {
      component dashboard {
        -> graphql
      }
      component adminPanel {
        -> graphql
      }
    }
  }

  customer -> dashboard
  support -> adminPanel

  system amazon {
    component s3

    cloud.backend.storage -> s3
  }

}

 */
var el = function (_a) {
    var _b;
    var id = _a.id, kind = _a.kind, title = _a.title, style = _a.style, tags = _a.tags, description = _a.description, props = __rest(_a, ["id", "kind", "title", "style", "tags", "description"]);
    return (__assign(__assign(__assign({ id: id, kind: kind, title: title !== null && title !== void 0 ? title : id }, description ? { description: { txt: description } } : {}), { technology: null, tags: (_b = tags) !== null && _b !== void 0 ? _b : null, links: null, style: __assign({}, style) }), props));
};
exports.fakeElements = {
    'cloud': el({
        id: 'cloud',
        kind: 'system',
        title: 'cloud',
    }),
    'customer': el({
        id: 'customer',
        kind: 'actor',
        title: 'customer',
        style: {
            shape: 'person',
        },
    }),
    'support': el({
        id: 'support',
        kind: 'actor',
        title: 'Support Engineer',
        description: 'Support engineers are responsible for supporting customers',
        style: {
            shape: 'person',
        },
    }),
    'cloud.backend': el({
        id: 'cloud.backend',
        kind: 'component',
        title: 'Backend',
    }),
    'cloud.frontend': el({
        id: 'cloud.frontend',
        kind: 'component',
        title: 'Frontend',
        style: {
            shape: 'browser',
        },
    }),
    'cloud.backend.graphql': el({
        id: 'cloud.backend.graphql',
        kind: 'component',
        title: 'Graphql API',
        description: 'Component that allows to query data via GraphQL.',
    }),
    'cloud.backend.storage': el({
        id: 'cloud.backend.storage',
        kind: 'component',
        title: 'Backend Storage',
        description: 'The backend storage is a component that stores data.',
        style: {
            shape: 'storage',
        },
    }),
    'cloud.frontend.adminPanel': el({
        id: 'cloud.frontend.adminPanel',
        kind: 'component',
        title: 'Admin Panel Webapp',
        description: 'The admin panel is a webapp that allows support staff to manage customer data.',
    }),
    'cloud.frontend.dashboard': el({
        id: 'cloud.frontend.dashboard',
        kind: 'component',
        title: 'Customer Dashboard Webapp',
        description: 'The customer dashboard is a webapp that allows customers to view their data.',
    }),
    'amazon': el({
        id: 'amazon',
        kind: 'system',
        title: 'Amazon',
        description: 'Amazon is a cloud provider',
    }),
    'amazon.s3': el({
        id: 'amazon.s3',
        kind: 'component',
        title: 'S3',
        description: 'S3 is a storage service',
    }),
};
var fakeRelations = {
    'customer:cloud.frontend.dashboard': {
        id: 'customer:cloud.frontend.dashboard',
        source: { model: 'customer' },
        target: { model: 'cloud.frontend.dashboard' },
        title: 'opens in browser',
    },
    'support:cloud.frontend.adminPanel': {
        id: 'support:cloud.frontend.adminPanel',
        source: { model: 'support' },
        target: { model: 'cloud.frontend.adminPanel' },
        title: 'manages',
    },
    'cloud.backend.storage:amazon.s3': {
        id: 'cloud.backend.storage:amazon.s3',
        source: { model: 'cloud.backend.storage' },
        target: { model: 'amazon.s3' },
        title: 'persists artifacts',
        tail: 'odiamond',
    },
    'cloud.backend.graphql:cloud.backend.storage': {
        id: 'cloud.backend.graphql:cloud.backend.storage',
        source: { model: 'cloud.backend.graphql' },
        target: { model: 'cloud.backend.storage' },
        title: '',
    },
    'cloud.frontend.dashboard:cloud.backend.graphql': {
        id: 'cloud.frontend.dashboard:cloud.backend.graphql',
        source: { model: 'cloud.frontend.dashboard' },
        target: { model: 'cloud.backend.graphql' },
        title: 'fetches data',
    },
    'cloud.frontend.adminPanel:cloud.backend.graphql': {
        id: 'cloud.frontend.adminPanel:cloud.backend.graphql',
        source: { model: 'cloud.frontend.adminPanel' },
        target: { model: 'cloud.backend.graphql' },
        title: 'fetches data in zero trust network with sso authentification',
    },
};
exports.indexView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'index',
    title: '',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                {
                    wildcard: true,
                },
            ],
        },
    ],
};
exports.cloudView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'cloudView',
    title: '',
    description: null,
    tags: null,
    links: null,
    viewOf: 'cloud',
    rules: [
        {
            include: [{ wildcard: true }],
        },
    ],
};
exports.cloud3levels = {
    _stage: 'parsed',
    _type: 'element',
    id: 'cloud3levels',
    title: '',
    viewOf: 'cloud',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
                // include cloud.frontend.*
                {
                    ref: { model: 'cloud.frontend' },
                    selector: 'children',
                },
                // include cloud.backend.*
                {
                    ref: { model: 'cloud.backend' },
                    selector: 'children',
                },
            ],
        },
        {
            exclude: [
                // exclude cloud.frontend
                { ref: { model: 'cloud.frontend' } },
            ],
        },
    ],
};
exports.amazonView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'amazon',
    title: '',
    viewOf: 'amazon',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
                // include cloud
                { ref: { model: 'cloud' } },
                // include cloud.* -> amazon
                {
                    source: { ref: { model: 'cloud' }, selector: 'children' },
                    target: { ref: { model: 'amazon' } },
                },
            ],
        },
    ],
};
// see https://github.com/likec4/likec4/issues/577
var issue577View = function (icon) { return ({
    _stage: 'parsed',
    _type: 'element',
    id: 'issue577',
    title: '',
    description: null,
    tags: null,
    links: null,
    viewOf: 'amazon',
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
            ],
        },
        {
            targets: [
                { wildcard: true },
            ],
            style: {
                color: 'red',
                icon: icon,
            },
        },
    ],
}); };
exports.issue577View = issue577View;
exports.FakeModel = {
    _type: 'computed',
    projectId: 'test',
    project: { id: 'test' },
    elements: exports.fakeElements,
    relations: fakeRelations,
    views: {},
    specification: {
        elements: {
            actor: {},
            system: {},
            component: {},
        },
        relationships: {},
        deployments: {},
        tags: {},
    },
    deployments: {
        elements: {},
        relations: {},
    },
    globals: {
        dynamicPredicates: {},
        predicates: {},
        styles: {},
    },
    imports: {},
};
