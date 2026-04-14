import { Component } from 'react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // Keep console output for debugging in dev.
    // eslint-disable-next-line no-console
    console.error(error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = this.state.error?.message || String(this.state.error || 'Unknown error')
    const stack = this.state.error?.stack || ''
    const comp = this.state.info?.componentStack || ''

    return (
      <div className="eb-root">
        <div className="container">
          <div className="eb-card">
            <h2 className="eb-title">页面渲染出错</h2>
            <p className="eb-sub">已拦截错误以避免白屏。下面信息可用于定位问题。</p>
            <div className="eb-msg">{message}</div>
            {(stack || comp) && (
              <details className="eb-details">
                <summary>展开错误详情</summary>
                {stack && <pre className="eb-pre">{stack}</pre>}
                {comp && <pre className="eb-pre">{comp}</pre>}
              </details>
            )}
          </div>
        </div>
      </div>
    )
  }
}

