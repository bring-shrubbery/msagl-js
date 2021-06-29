export class MultidimensionalScaling {
        MultidimensionalScaling() { }//suppressing the creation of the public constructor
        /// <summary>
        /// Double-centers a matrix in such a way that the center of gravity is zero.
        /// After number-centering, each row and each column sums up to zero.
        /// </summary>
        /// <param name="matrix"></param>
        static DoubleCenter(matrix:number[][]) {
            const rowMean =new Array<number>(matrix.length)
            const colMean = new Array<number>(matrix[0].length);
            let mean = 0;
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[0].length; j++) {
                    rowMean[i] += matrix[i][j];
                    colMean[j] += matrix[i][j];
                    mean += matrix[i][j];
                }
            }
            for (let i = 0; i < matrix.length; i++) rowMean[i] /= matrix.length;
            for (let j = 0; j < matrix[0].length; j++) colMean[j] /= matrix[0].length;
            mean /= matrix.length;
            mean /= matrix[0].length;
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[0].length; j++) {
                    matrix[i][j] -= rowMean[i] + colMean[j] - mean;
                }
            }
        }

        /// <summary>
        /// Squares all entries of a matrix.
        /// </summary>
        /// <param name="matrix">A matrix.</param>
        public static SquareEntries(matrix:number[][]) {
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[0].length; j++) {
                    matrix[i][j] = Math.pow(matrix[i][j], 2);
                }
            }
        }

        /// <summary>
        /// Multiplies a matrix with a scalar factor.
        /// </summary>
        /// <param name="matrix">A matrix.</param>
        /// <param name="factor">A scalar factor.</param>
        public static Multiply(matrix:number[][], factor:number) {
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[0].length; j++) {
                    matrix[i][j] *= factor;
                }
            }
        }

        /// <summary>
        /// Multiply a square matrix and a vector. 
        /// Note that matrix width and vector length
        /// have to be equal, otherwise null is returned.
        /// </summary>
        /// <param name="A">A matrix.</param>
        /// <param name="x">A vector.</param>
        /// <returns>The resulting product vector, or null if matrix and vector
        /// are incompatible.</returns>
        public static  MultiplyX(A:number[][], x:number[]):number[] {
            if(A[0].length!=x.length) return null;
            const y=new Array<number>(x.length)
            for (let i = 0; i < A.length; i++) {
                for (let j = 0; j < A[0].length; j++) {
                    y[i]+=A[i][j]*x[j];
                }
            }
            return y;
        }

        /// <summary>
        /// Gives the norm of a vector, that is, its length in
        /// vector.length dimensional Euclidean space.
        /// </summary>
        /// <param name="x">A vector.</param>
        /// <returns>The norm of the vector.</returns>
        public static Norm(x:number[]):number {
            let norm=0;
            for (let i = 0; i < x.length; i++) {
                norm += Math.pow(x[i], 2);
            }
            norm = Math.sqrt(norm);
            return norm;
        }

        /// <summary>
        /// Normalizes a vector to unit length (1.0) in
        /// vector.length dimensional Euclidean space.
        /// If the vector is the 0-vector, nothing is done.
        /// </summary>
        /// <param name="x">A vector.</param>
        /// <returns>The norm of the vector.</returns>
        public static  Normalize( x:number[]) :number{
            let lambda = MultidimensionalScaling.Norm(x);
            if (lambda <= 0) return 0;
            for (let i = 0; i < x.length; i++) {
                x[i] /= lambda;
            }
            return lambda;
        }

        /// <summary>`
        /// Gives a random unit Euclidean length vector of a given size.
        /// </summary>
        /// <param name="n">The size ofthe vector.</param>
        /// <param name="seed">A seed for the random number generator.</param>
        /// <returns>A random vector.</returns>
        public static  RandomUnitLengthVector(n:number, seed:number):number[] {
            const result=new Array<number>(n)
            for (let i = 0; i < n; i++) {
                result[i] = random();
            }
            Normalize(result);
            return result;
        }

        /// <summary>
        /// Computes the two dominant eigenvectors and eigenvalues of a symmetric
        /// square matrix.
        /// </summary>
        /// <param name="A">A matrix.</param>
        /// <param name="u1">First eigenvector.</param>
        /// <param name="lambda1">First eigenvalue.</param>
        /// <param name="u2">Second eigenvector.</param>
        /// <param name="lambda2">Second eigenvalue.</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "u"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "A"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1709:IdentifiersShouldBeCasedCorrectly", MessageId = "A"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "4#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "3#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "2#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "1#")]
        public static void SpectralDecomposition(number[][] A,
            out number[] u1, out number lambda1,
            out number[] u2, out number lambda2) {
            SpectralDecomposition(A, out u1, out lambda1, out u2, out lambda2, 30, 1e-6);
        }

        /// <summary>
        /// Computes the two dominant eigenvectors and eigenvalues of a symmetric
        /// square matrix.
        /// </summary>
        /// <param name="A">A matrix.</param>
        /// <param name="u1">First eigenvector.</param>
        /// <param name="lambda1">First eigenvalue.</param>
        /// <param name="u2">Second eigenvector.</param>
        /// <param name="lambda2">Second eigenvalue.</param>
        /// <param name="maxIterations"></param>
        /// <param name="epsilon"></param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "u"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "A"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1709:IdentifiersShouldBeCasedCorrectly", MessageId = "A"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "4#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "3#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "2#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "1#")]
        public static void SpectralDecomposition(number[][] A,
            out number[] u1, out number lambda1,
            out number[] u2, out number lambda2, int maxIterations, number epsilon) {
                ValidateArg.IsNotNull(A, "A");
            int n = A[0].Length;
            u1 = RandomUnitLengthVector(n, 0); lambda1 = 0;
            u2 = RandomUnitLengthVector(n, 1); lambda2 = 0;
            number r = 0;
            number limit = 1.0 - epsilon;
            // iterate until convergence but at most 30 steps
            for (int i = 0; (i < maxIterations && r < limit); i++) {
                number[] x1 = Multiply(A, u1);
                number[] x2 = Multiply(A, u2);

                lambda1 = Normalize(x1);
                lambda2 = Normalize(x2);
                MakeOrthogonal(x2, x1);
                Normalize(x2);

                // convergence is assumed if the inner product of
                // two consecutive (unit length) iterates is close to 1
                r = Math.min(DotProduct(u1, x1), DotProduct(u2, x2));
                u1 = x1;
                u2 = x2;
            }
        }
        /// <summary>
        /// Gives the inner product of two vectors of the same size.
        /// </summary>
        /// <param name="x">A vector.</param>
        /// <param name="y">A vector.</param>
        /// <returns>The inner product of the two vectors.</returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x")]
        public static number DotProduct(number[] x, number[] y) {
            ValidateArg.IsNotNull(x, "x");
            ValidateArg.IsNotNull(y, "y");
            if (x.Length != y.Length) return 0;
            number result = 0;
            for (int i = 0; i < x.Length; i++) {
                result += x[i]*y[i];
            }
            return result;
        }

        /// <summary>
        /// Orthogonalizes a vector against another vector, so that
        /// their scalar product is 0.
        /// </summary>
        /// <param name="x">Vector to be orthogonalized.</param>
        /// <param name="y">Vector to orthogonalize against.</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x")]
        public static void MakeOrthogonal(number[] x, number[] y) {
            ValidateArg.IsNotNull(x, "x");
            ValidateArg.IsNotNull(y, "y");
            if (x.Length != y.Length) return;
            number prod = DotProduct(x, y) / DotProduct(y, y);            
            for (int i = 0; i < x.Length; i++) {
                x[i] -= prod*y[i];
            }
        }

        /// <summary>
        /// Classical multidimensional scaling.  Computes two-dimensional coordinates
        /// for a given distance matrix by computing the two largest eigenvectors
        /// and eigenvalues of a matrix assiciated with the distance matrix (called
        /// "fitting inner products").
        /// </summary>
        /// <param name="d">The distance matrix.</param>
        /// <param name="x">The first eigenvector (scaled by the root of its eigenvalue)</param>
        /// <param name="y">The second eigenvector (scaled by the root of its eigenvalue)</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1062:Validate arguments of public methods", MessageId = "1")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1062:Validate arguments of public methods", MessageId = "2")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "1#")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "2#")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "d")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x")]
        public static void ClassicalScaling(number[][] d, out number[] x, out number[] y) {
            ValidateArg.IsNotNull(d, "d");
            number[][] b = new number[d.Length][];
            for (int i = 0; i < d.Length; i++) {
                b[i] = new number[d[0].Length];
                d[i].CopyTo(b[i], 0);
            }
            SquareEntries(b);
            DoubleCenter(b);
            Multiply(b, -.5);
            number lambda1;
            number lambda2;
            SpectralDecomposition(b, out x, out lambda1, out y, out lambda2);
            lambda1=Math.sqrt(Math.abs(lambda1));
            lambda2=Math.sqrt(Math.abs(lambda2));
            for (int i = 0; i < x.Length; i++) {
                x[i] *= lambda1;
                y[i] *= lambda2;
            }
        }

        /// <summary>
        /// Multidimensional scaling.  Computes two-dimensional coordinates
        /// for a given distance matrix by fitting the coordinates to these distances
        /// iteratively by majorization (called "distance fitting").
        /// Only objects that have rows in the distance/weight matrix
        /// is subject to iterative relocation.
        /// </summary>
        /// <param name="d">A distance matrix.</param>
        /// <param name="x">Coordinate vector.</param>
        /// <param name="y">Coordinate vector.</param>
        /// <param name="w">Weight matrix.</param>
        /// <param name="numberOfIterations">Number of iteration steps.</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "w"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "d")]
        public static void DistanceScalingSubset(number[][] d, number[] x, number[] y, number[][] w, int numberOfIterations) {
            ValidateArg.IsNotNull(d, "d");
            ValidateArg.IsNotNull(x, "x");
            ValidateArg.IsNotNull(y, "y");
            ValidateArg.IsNotNull(w, "w");
            int n = x.Length;
            int k = d.Length;
            int[] index = new int[k];
            for (int i = 0; i < k; i++) {
                for (int j = 0; j < n; j++) {
                    if (d[i][j] == 0) {
                        index[i] = j;
                    }
                }
            }

            number[] wSum = new number[k];
            for (int i = 0; i < k; i++) {
                for (int j = 0; j < n; j++) {
                    if(index[i]!=j) {
                        wSum[i] += w[i][j];
                    }
                }
            }
            for (int c = 0; c < numberOfIterations; c++) {
                for (int i = 0; i < k; i++) {
                    number xNew = 0;
                    number yNew = 0;
                    for (int j = 0; j < n; j++) {
                        if (i != j) {
                            number inv = Math.sqrt(Math.pow(x[index[i]] - x[j], 2) + Math.pow(y[index[i]] - y[j], 2));
                            if (inv > 0) inv = 1 / inv;
                            xNew += w[i][j] * (x[j] + d[i][j] * (x[index[i]] - x[j]) * inv);
                            yNew += w[i][j] * (y[j] + d[i][j] * (y[index[i]] - y[j]) * inv);
                        }
                    }
                    x[index[i]] = xNew / wSum[i];
                    y[index[i]] = yNew / wSum[i];
                }
            }
        }

        /// <summary>
        /// Multidimensional scaling.  Computes two-dimensional coordinates
        /// for a given distance matrix by fitting the coordinates to these distances
        /// iteratively by majorization (called "distance fitting").
        /// (McGee, Kamada-Kawai)
        /// </summary>
        /// <param name="d">A distance matrix.</param>
        /// <param name="x">Coordinate vector.</param>
        /// <param name="y">Coordinate vector.</param>
        /// <param name="w">Weight matrix.</param>
        /// <param name="iter">Number of iteration steps.</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Globalization", "CA1303:Do not pass literals as localized parameters", MessageId = "System.Diagnostics.Debug.Write(System.String)"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "d"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "w"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "iter")]
        public static void DistanceScaling(number[][] d, number[] x, number[] y, number[][] w, int iter) {
            ValidateArg.IsNotNull(d, "d");
            ValidateArg.IsNotNull(x, "x");
            ValidateArg.IsNotNull(y, "y");
            ValidateArg.IsNotNull(w, "w");
            int n = x.Length;
            number[] wSum = new number[n];
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (i != j)
                        wSum[i] += w[i][j];
                }
            }
            for (int c = 0; c < iter; c++) {
                for (int i = 0; i < n; i++) {
                    number xNew = 0;
                    number yNew = 0;
                    for (int j = 0; j < n; j++) {
                        if(i!=j) {
                            number inv = Math.sqrt(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2));
                            if (inv > 0) inv=1/inv;
                            xNew += w[i][j] * (x[j] + d[i][j] * (x[i] - x[j]) * inv);
                            yNew += w[i][j] * (y[j] + d[i][j] * (y[i] - y[j]) * inv);
                        }
                    }
                    x[i] = xNew/wSum[i];
                    y[i] = yNew/wSum[i];
                }
            }
        }

        /// <summary>
        /// Convenience method for generating a weight matrix from a distance matrix.
        /// Each output entry is the corresponding input entry powered by a constant
        /// exponent.
        /// </summary>
        /// <param name="d">A distance matrix.</param>
        /// <param name="exponent">The exponent.</param>
        /// <returns>A weight matrix.</returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "d")]
        public static number[][] ExponentialWeightMatrix(number[][] d, number exponent) {
            ValidateArg.IsNotNull(d, "d");
            number[][] w=new number[d.Length][];
            for (int i = 0; i < d.Length; i++) {
                w[i] = new number[d[i].Length];
                for (int j = 0; j < d[i].Length; j++) {
                    if(d[i][j]>0)
                        w[i][j] = Math.pow(d[i][j], exponent);
                }
            }
            return w;
        }


        /// <summary>
        /// Convenience method for all Euclidean distances within two-dimensional
        /// positions.
        /// </summary>
        /// <param name="x">Coordinates.</param>
        /// <param name="y">Coordinates.</param>
        /// <returns></returns>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x")]
        public static number[][] EuclideanDistanceMatrix(number[] x, number[] y) {
            ValidateArg.IsNotNull(x, "x");
            ValidateArg.IsNotNull(y, "y");
            number[][] d = new number[x.Length][];
            for (int i = 0; i < x.Length; i++) {
                d[i] = new number[x.Length];
                for (int j = 0; j < x.Length; j++) {
                    d[i][j] = Math.sqrt(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2));
                }
            }
            return d;
        }





        /// <summary>
        /// Approximation to classical multidimensional scaling.
        /// Computes two-dimensional coordinates
        /// for a given rectangular distance matrix.
        /// </summary>
        /// <param name="d">The distance matrix.</param>
        /// <param name="x">The first eigenvector (scaled by the root of its eigenvalue)</param>
        /// <param name="y">The second eigenvector (scaled by the root of its eigenvalue)</param>
        /// <param name="pivotArray">index of pivots</param>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "y"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "x"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1704:IdentifiersShouldBeSpelledCorrectly", MessageId = "d"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "2#"), System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Design", "CA1021:AvoidOutParameters", MessageId = "1#")]
        internal static void LandmarkClassicalScaling(number[][] d, out number[] x, out number[] y, int[] pivotArray ) {
         
            number[][] c=new number[d.Length][];
            for (int i = 0; i < d.Length; i++) {
                c[i]=new number[d.Length];
                for (int j = 0; j < d.Length; j++) {
                    c[i][j]=d[i][pivotArray[j]];
                }
            }
            SquareEntries(c);
            number[] mean=new number[d.Length];
            for (int i = 0; i < d.Length; i++) {
                for (int j = 0; j < d.Length; j++) {
                    mean[i] += c[i][j];
                }
                mean[i] /= d.Length;
            }
            DoubleCenter(c);
            Multiply(c, -.5);
            number[] u1, u2;
            number lambda1, lambda2;
            SpectralDecomposition(c, out u1, out lambda1, out u2, out lambda2);
            lambda1 = Math.sqrt(Math.abs(lambda1));
            lambda2 = Math.sqrt(Math.abs(lambda2));

            // place non-pivots by weighted barycenter
            x=new number[d[0].Length];
            y=new number[d[0].Length];
            for (int i = 0; i < x.Length; i++) {
                for (int j = 0; j < c.Length; j++) {
                    x[i] -= u1[j] * (Math.pow(d[j][i], 2) - mean[j]) / 2;
                    y[i] -= u2[j] * (Math.pow(d[j][i], 2) - mean[j]) / 2;
                }
            }
        }
    }