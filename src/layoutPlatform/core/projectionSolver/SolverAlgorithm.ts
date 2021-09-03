// --------------------------------------------------------------------------------------------------------------------
// <copyright file="SolverAlgorithm.cs" company="Microsoft">
//   (c) Microsoft Corporation.  All rights reserved.
// </copyright>

// MSAGL class for algorithm enumeration for Projection Solver.

// --------------------------------------------------------------------------------------------------------------------

namespace Microsoft.Msagl.Core.ProjectionSolver {
  /// The algorithm used by the ProjectionSolver.

  public enum SolverAlgorithm {
    /// Iterative Project/Split only.

    ProjectOnly,

    /// Diagonally-scaled gradient projection/Qpsc (Quadratic Programming for Separation Constraints).

    QpscWithScaling,

    /// Gradient projection/Qpsc (Quadratic Programming for Separation Constraints) without diagonal scaling.

    QpscWithoutScaling,
  }
}
