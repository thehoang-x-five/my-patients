import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.error(err);
  }
  render() {
    if (this.state.hasError)
      return (
        <div role="alert" className="card p-6">
          <h3 className="font-bold text-red-600 mb-2">Đã xảy ra lỗi</h3>
          <p>Vui lòng tải lại trang hoặc liên hệ quản trị.</p>
        </div>
      );
    return this.props.children;
  }
}
