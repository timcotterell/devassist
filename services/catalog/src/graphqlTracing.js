import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace
} from '@opentelemetry/api';

const tracer = trace.getTracer(
  'devassist-catalog',
  '0.1.0'
);

export function startGraphQLSpan(
  req,
  requestId
) {
  const parentContext = propagation.extract(
    context.active(),
    req.headers
  );

  return tracer.startSpan(
    'POST /graphql',
    {
      kind: SpanKind.SERVER,

      attributes: {
        'http.request.method': 'POST',
        'url.path': '/graphql',
        'devassist.request.id': requestId
      }
    },
    parentContext
  );
}

export const graphqlTracingPlugin = {
  async requestDidStart({
    contextValue
  }) {
    const span =
      contextValue?.otelSpan;

    let ended = false;

    const endSpan = () => {
      if (
        ended ||
        !span
      ) {
        return;
      }

      ended = true;
      span.end();
    };

    return {
      async didEncounterErrors() {
        span?.setStatus({
          code: SpanStatusCode.ERROR
        });
      },

      async willSendResponse() {
        endSpan();
      }
    };
  }
};